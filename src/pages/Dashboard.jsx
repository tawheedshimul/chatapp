import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import Sidebar from '../components/Sidebar';
import Chat from '../components/Chat';

const API_BASE_URL = 'http://localhost:7000';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/users/me`, {
          withCredentials: true
        });
        if (!data) {
          throw new Error('No user data received');
        }
        setUser(data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        setError('Failed to authenticate. Please login again.');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [navigate]);

  useEffect(() => {
    if (user?._id) {
      const newSocket = io(API_BASE_URL, {
        withCredentials: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on('connect', () => {
        console.log('Socket connected');
        newSocket.emit('authenticate', user._id);
      });

      newSocket.on('connect_error', (err) => {
        console.error('Socket connection error:', err);
      });

      newSocket.on('online_users', (users) => {
        setOnlineUsers(users);
      });

      newSocket.on('user_status', ({ userId, status }) => {
        setOnlineUsers(prev => {
          if (status === 'online') {
            return [...new Set([...prev, userId])];
          } else {
            return prev.filter(id => id !== userId);
          }
        });
      });

      setSocket(newSocket);

      return () => {
        newSocket.off('connect');
        newSocket.off('connect_error');
        newSocket.off('online_users');
        newSocket.off('user_status');
        newSocket.disconnect();
      };
    }
  }, [user?._id]);

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const { data } = await axios.get(`${API_BASE_URL}/api/conversations`, {
          withCredentials: true
        });
        setConversations(data);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
        setError('Failed to load conversations');
      }
    };

    if (user?._id) fetchConversations();
  }, [user?._id]);

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
        withCredentials: true
      });
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Logout failed. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center p-4 bg-red-100 rounded-lg">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!user || !user.username) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p>No user data found. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex flex-col w-80 border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Chat App</h1>
            <button
              onClick={handleLogout}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Logout
            </button>
          </div>
          <div className="mt-2 flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div className="ml-3">
              <p className="font-medium">{user.username}</p>
              <p className="text-xs text-gray-500">
                {onlineUsers.includes(user._id) ? 'Online' : 'Offline'}
              </p>
            </div>
          </div>
        </div>
        
        <Sidebar 
          conversations={conversations} 
          onlineUsers={onlineUsers}
          currentChat={currentChat}
          setCurrentChat={setCurrentChat}
        />
      </div>
      
      <div className="flex-1 flex flex-col">
        {currentChat ? (
          <Chat 
            currentChat={currentChat} 
            user={user} 
            socket={socket} 
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-700">Select a chat</h2>
              <p className="text-gray-500">Choose a conversation to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;