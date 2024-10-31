import React, { useRef, useEffect, useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Text, 
  StyleSheet, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard
} from 'react-native';
import { useAppSelector, useAppDispatch } from '../hooks';
import { addMessage, setLoading } from '../slice';

interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
}

const ChatPage: React.FC = () => {
  const [messageText, setMessageText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const dispatch = useAppDispatch();
  
  // Get messages and states from Redux
  const messages = useAppSelector(state => {
    const currentTime = Date.now();
    // Only return messages within the last hour
    return state.user.messages.filter(msg => currentTime - msg.timestamp < 3600000);
  });
  const isLoading = useAppSelector(state => state.user.isLoading);
  const accentColor = useAppSelector(state => state.user.accentColor);

  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow', 
      () => scrollToBottom(false)
    );
    
    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const getFormattedHistory = () => {
    return messages.slice(-10)
      .map(msg => `${msg.isBot ? 'Bot' : 'User'}: ${msg.text}`)
      .join('\n');
  };

  const sendMessage = async () => {
    if (messageText.trim()) {
      // Add user message to Redux
      dispatch(addMessage({
        text: messageText.trim(),
        isBot: false,
        timestamp: Date.now()
      }));
      
      setMessageText('');
      dispatch(setLoading(true));

      try {
        const response = await fetch('https://getquery-knmwvsxfla-uc.a.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText.trim(),
            history: getFormattedHistory()
          }),
        });

        const data: ApiResponse = await response.json();
        
        if (data.success && data.message) {
          dispatch(addMessage({
            text: data.message,
            isBot: true,
            timestamp: Date.now()
          }));
        } else {
          dispatch(addMessage({
            text: data.error || 'Sorry, I could not process that.',
            isBot: true,
            timestamp: Date.now()
          }));
        }
      } catch (error) {
        console.error('Error:', error);
        dispatch(addMessage({
          text: 'Sorry, there was an error processing your message.',
          isBot: true,
          timestamp: Date.now()
        }));
      } finally {
        dispatch(setLoading(false));
      }
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
    >
      <View style={styles.inner}>
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollToBottom()}
          onLayout={() => scrollToBottom(false)}
        >
          {messages.map((msg, index) => (
            <View 
              key={`${msg.timestamp}-${index}`}
              style={[
                styles.messageBubble,
                msg.isBot ? styles.botBubble : styles.userBubble,
                index > 0 && messages[index - 1].isBot === msg.isBot && styles.groupedMessage
              ]}
            >
              <Text style={[
                styles.messageText,
                msg.isBot ? styles.botText : styles.userText
              ]}>
                {msg.text}
              </Text>
            </View>
          ))}
          {isLoading && (
            <View style={[styles.messageBubble, styles.botBubble, styles.loadingBubble]}>
              <ActivityIndicator color="#999" size="small" />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={messageText}
            placeholder="Chat here..."
            placeholderTextColor="#999"
            onChangeText={setMessageText}
            multiline
            onSubmitEditing={sendMessage}
            returnKeyLabel="done"
            returnKeyType="done"
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={sendMessage}
            disabled={!messageText.trim() || isLoading}
          >
            <Text style={[
              styles.sendButtonText,
              (!messageText.trim() || isLoading) && styles.sendButtonDisabled
            ]}>
              Send
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  inner: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 10,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '70%',
    padding: 12,
    borderRadius: 15,
    marginVertical: 5,
  },
  groupedMessage: {
    marginVertical: 1,
  },
  userBubble: {
    backgroundColor: '#880808',
    alignSelf: 'flex-end',
    //borderTopRightRadius: 5,
  },
  botBubble: {
    backgroundColor: '#E9E9EB',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 5,
  },
  loadingBubble: {
    padding: 15,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  userText: {
    color: '#FFFFFF',
  },
  botText: {
    color: '#000000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: '#E9E9EB',
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginRight: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E9E9EB',
  },
  sendButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  sendButtonText: {
    color: '#880808',
    fontSize: 16,
    fontWeight: '600',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default ChatPage;