"use client"

import { useState } from "react"
import { useSocket } from "../context/SocketContext"
import { Search, Plus, Users, MessageCircle } from "lucide-react"
import UserAvatar from "./UserAvatar"
import NewConversationModal from "./NewConversationModal"

const Sidebar = ({
  conversations,
  activeConversation,
  onSelectConversation,
  onNewConversation,
  loading,
  currentUser,
}) => {
  const { isUserOnline } = useSocket()
  const [searchTerm, setSearchTerm] = useState("")
  const [showNewConversationModal, setShowNewConversationModal] = useState(false)
  const [activeTab, setActiveTab] = useState("chats")

  const filteredConversations = conversations.filter((conversation) => {
    return conversation.otherUser.username.toLowerCase().includes(searchTerm.toLowerCase())
  })

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
  }

  const handleNewConversation = () => {
    setShowNewConversationModal(true)
  }

  const handleCloseModal = () => {
    setShowNewConversationModal(false)
  }

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return ""

    const date = new Date(timestamp)
    const now = new Date()
    const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) {
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    } else if (diffInDays === 1) {
      return "Yesterday"
    } else if (diffInDays < 7) {
      return date.toLocaleDateString([], { weekday: "short" })
    } else {
      return date.toLocaleDateString([], { month: "short", day: "numeric" })
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      {/* User profile section */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <UserAvatar user={currentUser} size="large" />
        <div className="ml-3 overflow-hidden">
          <p className="font-medium text-gray-900 dark:text-white truncate">{currentUser?.username}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{currentUser?.email}</p>
        </div>
      </div>

      {/* Search bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full rounded-full border border-gray-300 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("chats")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "chats"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <div className="flex items-center justify-center">
            <MessageCircle className="h-4 w-4 mr-1.5" />
            <span>Chats</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === "users"
              ? "text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400"
              : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
          }`}
        >
          <div className="flex items-center justify-center">
            <Users className="h-4 w-4 mr-1.5" />
            <span>Users</span>
          </div>
        </button>
      </div>

      {/* Conversation list header */}
      <div className="flex items-center justify-between px-4 py-3">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
          {activeTab === "chats" ? "Conversations" : "People"}
        </h2>
        <button
          onClick={handleNewConversation}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:hover:bg-blue-800/50 transition-colors"
          aria-label="New conversation"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-blue-500"></div>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <div className="rounded-full bg-gray-100 dark:bg-gray-700 p-3 mb-3">
              <MessageCircle className="h-6 w-6 text-gray-400 dark:text-gray-500" />
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">No conversations yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Start a new conversation by clicking the + button
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredConversations.map((conversation) => {
              const isActive = activeConversation && activeConversation._id === conversation._id
              const isOnline = isUserOnline(conversation.otherUser._id)

              return (
                <li
                  key={conversation._id}
                  onClick={() => onSelectConversation(conversation)}
                  className={`cursor-pointer p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/50 ${
                    isActive ? "bg-blue-50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="relative flex-shrink-0">
                      <UserAvatar user={conversation.otherUser} />
                      <span
                        className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800 ${
                          isOnline ? "bg-green-500" : "bg-gray-300 dark:bg-gray-600"
                        }`}
                      ></span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="truncate text-sm font-medium text-gray-900 dark:text-white">
                          {conversation.otherUser.username}
                        </h3>
                        {conversation.lastMessage && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">
                            {formatTimestamp(conversation.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-sm text-gray-500 dark:text-gray-400">
                        {conversation.lastMessage
                          ? (conversation.lastMessage.sender._id === currentUser?._id ? "You: " : "") +
                            conversation.lastMessage.text
                          : "Start a conversation"}
                      </p>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {showNewConversationModal && (
        <NewConversationModal onClose={handleCloseModal} onNewConversation={onNewConversation} />
      )}
    </div>
  )
}

export default Sidebar

