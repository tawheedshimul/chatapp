import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Message from './Message';
import { FiSend, FiArrowLeft } from 'react-icons/fi';
import { IoMdMore } from 'react-icons/io';

function Chat({ currentChat, user, socket }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const { data } = await axios.get(`/api/messages/${currentChat._id}`, {
          withCredentials: true
        });
        setMessages(data);
      } catch (err) {
        console.error('Failed to fetch messages', err);
      }
    };

    fetchMessages();
    setOtherUser(currentChat.otherUser);
  }, [currentChat]);

  useEffect(() => {
    if (socket) {
      socket.on('new_message', (message) => {
        if (message.conversationId === currentChat._id) {
          setMessages(prev => [...prev, message]);
        }
      });

      socket.on('typing', ({ conversationId, userId }) => {
        if (conversationId === currentChat._id && userId !== user._id) {
          setIsTyping(true);
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
        }
      });

      socket.on('stop_typing', ({ conversationId }) => {
        if (conversationId === currentChat._id) {
          setIsTyping(false);
        }
      });
    }

    return () => {
      if (socket) {
        socket.off('new_message');
        socket.off('typing');
        socket.off('stop_typing');
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [socket, currentChat, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const message = {
        conversationId: currentChat._id,
        text: newMessage
      };

      const { data } = await axios.post('/api/messages', message, {
        withCredentials: true
      });

      setMessages(prev => [...prev, data]);
      setNewMessage('');
      
      // Stop typing indicator
      socket.emit('stop_typing', {
        conversationId: currentChat._id,
        userId: user._id
      });
    } catch (err) {
      console.error('Failed to send message', err);
    }
  };

  const handleTyping = () => {
    if (!socket) return;

    socket.emit('typing', {
      conversationId: currentChat._id,
      userId: user._id
    });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop_typing', {
        conversationId: currentChat._id,
        userId: user._id
      });
    }, 2000);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between bg-white">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {otherUser?.username.charAt(0).toUpperCase()}
            </div>
          </div>
          <div className="ml-3">
            <p className="font-medium">{otherUser?.username}</p>
            <p className="text-xs text-gray-500">
              {isTyping ? 'typing...' : 'online'}
            </p>
          </div>
        </div>
        <button className="text-gray-500 hover:text-gray-700">
          <IoMdMore className="h-5 w-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50">
        {messages.length > 0 ? (
          messages.map(message => (
            <Message 
              key={message._id} 
              message={message} 
              own={message.sender === user._id} 
              otherUser={otherUser}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <p className="text-gray-500">No messages yet. Start the conversation!</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-gray-200 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-center">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 border border-gray-300 rounded-l-md py-2 px-4 focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
          />
          <button
            type="submit"
            className="bg-blue-600 text-white py-2 px-4 rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <FiSend className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default Chat;