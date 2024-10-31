import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native'
import { useAppSelector } from '../hooks';

interface ApiResponse {
  success: boolean;
  message: string;
  error?: string;
}

interface Message {
  text: string;
  isBot: boolean;
  timestamp: number;
}


const ChatPage: React.FC = () => {
  const [message, setMessage] = useState<string>('');
  const [messages, setMessages] = useState<Array<{text: string; isBot: boolean}>>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const accentColor = useAppSelector(state => state.user.accentColor);
  console.log(accentColor)
  // Enhanced scroll handling
  const scrollToBottom = (animated = true) => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle keyboard show/hide
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow', 
      () => scrollToBottom(false)
    );
    
    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  // Format history for the API
  const getFormattedHistory = () => {
    // Get last 10 messages for context window management
    const recentMessages = messages.slice(-10);
    return recentMessages
      .map(msg => `${msg.isBot ? 'Bot' : 'User'}: ${msg.text}`)
      .join('\n');
  };

  const sendMessage = async () => {
    if (message.trim()) {
      const newMessage: Message = {
        text: message.trim(),
        isBot: false,
        timestamp: Date.now()
      };
      
      const updatedMessages = [...messages, newMessage];
      setMessages(updatedMessages);
      setMessage('');
      setIsLoading(true);

      try {
        const response = await fetch('https://getquery-knmwvsxfla-uc.a.run.app', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message.trim(),
            history: getFormattedHistory()
          }),
        });

        const data: ApiResponse = await response.json();
        
        if (data.success && data.message) {
          const botResponse: Message = {
            text: data.message,
            isBot: true,
            timestamp: Date.now()
          };
          setMessages([...updatedMessages, botResponse]);
        } else if (data.error) {
          const errorMessage: Message = {
            text: data.error,
            isBot: true,
            timestamp: Date.now()
          };
          setMessages([...updatedMessages, errorMessage]);
        } else {
          const fallbackMessage: Message = {
            text: 'Sorry, I could not process that.',
            isBot: true,
            timestamp: Date.now()
          };
          setMessages([...updatedMessages, fallbackMessage]);
        }
      } catch (error) {
        console.error('Error:', error);
        const errorMessage: Message = {
          text: 'Sorry, there was an error processing your message.',
          isBot: true,
          timestamp: Date.now()
        };
        setMessages([...updatedMessages, errorMessage]);
      } finally {
        setIsLoading(false);
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
              key={index} 
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
            value={message}
            placeholder="Chat here..."
            placeholderTextColor="#999"
            onChangeText={setMessage}
            multiline
            onSubmitEditing={sendMessage}
            returnKeyLabel="done"
            returnKeyType="done"
          />
          <TouchableOpacity 
            style={styles.sendButton} 
            onPress={sendMessage}
            disabled={!message.trim() || isLoading}
          >
            <Text style={[
              styles.sendButtonText,
              (!message.trim() || isLoading) && styles.sendButtonDisabled
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