import os
os.environ["TOKENIZERS_PARALLELISM"] = "false"
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from openai import OpenAI

# Load environment variables
PINECONE_API_KEY = os.getenv('PINECONE_API_KEY')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Initialize Pinecone
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index('quickstart')

# Initialize SentenceTransformer
model = SentenceTransformer('all-MiniLM-L6-v2')

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY)

def query_and_respond(user_query, top_k=10):
    query_embedding = model.encode(user_query).tolist()
    results = index.query(vector=query_embedding, top_k=top_k, include_metadata=True)

    # Reassemble chunked responses
    reassembled_responses = {}
    for result in results['matches']:
        orig_id = result['metadata'].get('orig_id', 'unknown')
        chunk = result['metadata'].get('chunk', '')
        idx = int(result['metadata'].get('idx', 0))
        total = int(result['metadata'].get('total', 1))
        
        if orig_id not in reassembled_responses:
            reassembled_responses[orig_id] = [''] * total
        
        if idx < len(reassembled_responses[orig_id]):
            reassembled_responses[orig_id][idx] = chunk

    # Join chunks and prepare context
    context = "\n\n".join([
        f"Result:\nQuery: {orig_id}\nResponse: {''.join(chunks)}"
        for orig_id, chunks in reassembled_responses.items()
    ])

    prompt = f"""Given the following user query and search results, provide a concise and relevant answer based on the information in the 'Response' sections. If the information isn't directly available, use the context to infer a helpful response.

    User Query: {user_query}

    Search Results:
    {context}

    Please respond in a conversational manner, directly addressing the user's query with the most relevant information from the search results. If the exact information isn't available, provide the closest relevant details and suggest where the user might find more specific information."""

    response = client.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "system", "content": "You are a helpful assistant providing information based on the Texas Tech University webpage content. Always strive to give direct, actionable information when available."},
            {"role": "user", "content": prompt}
        ]
    )

    return response.choices[0].message.content

# Example usage
if __name__ == "__main__":
    while True:
        user_input = input("Ask a question (or type 'quit' to exit): ")
        if user_input.lower() == 'quit':
            break
        try:
            response = query_and_respond(user_input)
            print("\nAssistant:", response, "\n")
        except Exception as e:
            print(f"An error occurred: {str(e)}")
            print("Please try again with a different question.")


# Who is Tommy Dang?
# What are the library hours?
# Where can I get a replacement for my raider card? Does it cost money?
# Where can I get tutoring help?
# What is the process for appealing a grade?
# How do I apply for on-campus jobs?
# What's the process for requesting accommodations for disabilities?
# What is the First-Year Experience program at Texas Tech?

# reponses kinda long rn
# convert this to nodejs tomorrow