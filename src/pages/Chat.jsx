"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { useSocket } from "../context/SocketContext"
import { API_URL } from "../config"
import Sidebar from "../components/Sidebar"
import ChatWindow from "../components/ChatWindow"
import { LogOut, Moon, Sun, Menu, X } from "lucide-react"

const Chat = () => {
  const { currentUser, logout } = useAuth()
  const { connected } = useSocket()
  const [conversations, setConversations] = useState([])
  const [activeConversation, setActiveConversation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true" || window.matchMedia("(prefers-color-scheme: dark)").matches
  })
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
    localStorage.setItem("darkMode", darkMode)
  }, [darkMode])

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const response = await fetch("http://localhost:7000/api/conversations", {
          credentials: "include",
        })

        if (response.ok) {
          const data = await response.json()
          setConversations(data)
        }
      } catch (err) {
        console.error("Error fetching conversations:", err)
      } finally {
        setLoading(false)
      }
    }

    if (currentUser) {
      fetchConversations()
    }
  }, [currentUser])

  const handleLogout = async () => {
    await logout()
  }

  const handleConversationSelect = (conversation) => {
    setActiveConversation(conversation)
    setSidebarOpen(false) // Close sidebar on mobile after selecting a conversation
  }

  const addNewConversation = (conversation) => {
    setConversations((prev) => [conversation, ...prev])
    setActiveConversation(conversation)
    setSidebarOpen(false) // Close sidebar on mobile after creating a new conversation
  }

  const updateConversationLastMessage = (conversationId, message) => {
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv._id === conversationId) {
          return { ...conv, lastMessage: message }
        }
        return conv
      }),
    )
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  return (
    <div className="flex h-screen flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="flex h-16 items-center justify-between border-b border-gray-200 px-4 dark:border-gray-800 bg-white dark:bg-gray-800 shadow-sm z-10">
        <div className="flex items-center">
          <button
            onClick={toggleSidebar}
            className="mr-3 md:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? (
              <X className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            ) : (
              <Menu className="h-6 w-6 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
            Chat App
            <span className={`ml-2 h-2 w-2 rounded-full ${connected ? "bg-green-500" : "bg-red-500"}`}></span>
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleDarkMode}
            className="rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center rounded-md bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Logout"
          >
            <LogOut className="mr-1.5 h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Mobile overlay */}
        <div
          className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar */}
        <div
          className={`fixed md:static inset-y-0 left-0 w-80 z-30 md:z-auto transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          }`}
        >
          <Sidebar
            conversations={conversations}
            activeConversation={activeConversation}
            onSelectConversation={handleConversationSelect}
            onNewConversation={addNewConversation}
            loading={loading}
            currentUser={currentUser}
          />
        </div>

        {/* Chat Window */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            conversation={activeConversation}
            onMessageSent={updateConversationLastMessage}
            onOpenSidebar={() => setSidebarOpen(true)}
          />
        </div>
      </div>
    </div>
  )
}

export default Chat

