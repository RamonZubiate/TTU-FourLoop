from sentence_transformers import SentenceTransformer
import torch
from pinecone import Pinecone, ServerlessSpec
import json
import textwrap
import re
import hashlib

# Load a pre-trained model
model = SentenceTransformer('all-MiniLM-L6-v2')

# Function to split text into chunks
def split_into_chunks(text, max_chunk_size=100):  # Further reduced chunk size
    return textwrap.wrap(text, max_chunk_size, break_long_words=False, replace_whitespace=False)

# Function to create a valid ASCII ID
def create_ascii_id(text):
    ascii_text = re.sub(r'[^\x00-\x7F]+', '', text)
    ascii_text = re.sub(r'\s+', '_', ascii_text)
    if not ascii_text:
        return hashlib.md5(text.encode()).hexdigest()
    return ascii_text[:50]  # Shortened to 50 characters

# Read JSON data
with open('/Users/maxmontes/Desktop/aimodel/firebase/final.json', 'r') as f:
    data = json.load(f)

# Create embeddings
vectorized_data = []
for doc in data:
    if doc['ai_response']:
        doc_id = create_ascii_id(doc['user_input'])
        chunks = split_into_chunks(doc['ai_response'])
        for i, chunk in enumerate(chunks):
            embedding = model.encode(chunk)
            vectorized_data.append({
                'id': f"{doc_id}_{i}",
                'values': embedding.tolist(),
                'metadata': {
                    'orig_id': doc_id,  # Shortened key name
                    'chunk': chunk,  # Store only the chunk
                    'idx': i,  # Shortened key name
                    'total': len(chunks)  # Shortened key name
                }
            })

# Initialize Pinecone
pc = Pinecone(api_key="93909411-6cd0-45d8-b6e9-4f210bb75183")

# Create index if it doesn't exist
if 'quickstart' not in pc.list_indexes():
    pc.create_index(
        name='quickstart',
        dimension=384,
        metric='cosine',
        spec=ServerlessSpec(
            cloud='aws',
            region='us-east-1'
        )
    )

# Get the index
index = pc.Index('quickstart')

# Upsert vectors to Pinecone
batch_size = 25  # Further reduced batch size
for i in range(0, len(vectorized_data), batch_size):
    batch = vectorized_data[i:i+batch_size]
    try:
        index.upsert(vectors=batch)
        print(f"Upserted batch {i//batch_size + 1}")
    except Exception as e:
        print(f"Error upserting batch {i//batch_size + 1}: {str(e)}")
        # Implement a retry mechanism or log the failed batch for manual review

print("Data processing completed.")