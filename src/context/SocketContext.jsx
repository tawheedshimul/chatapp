"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "./AuthContext"
// import { SOCKET_URL } from "../config"

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const { currentUser } = useAuth()
  const [socket, setSocket] = useState(null)
  const [onlineUsers, setOnlineUsers] = useState([])
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!currentUser) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setConnected(false)
      }
      return
    }

    const newSocket = io('http://localhost:7000', {
      withCredentials: true,
    })

    newSocket.on("connect", () => {
      console.log("Socket connected")
      setConnected(true)
      newSocket.emit("authenticate", currentUser._id)
    })

    newSocket.on("disconnect", () => {
      console.log("Socket disconnected")
      setConnected(false)
    })

    newSocket.on("online_users", (users) => {
      setOnlineUsers(users)
    })

    newSocket.on("user_status", ({ userId, status }) => {
      if (status === "online") {
        setOnlineUsers((prev) => [...prev, userId])
      } else {
        setOnlineUsers((prev) => prev.filter((id) => id !== userId))
      }
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [currentUser])

  const isUserOnline = (userId) => {
    return onlineUsers.includes(userId)
  }

  const value = {
    socket,
    connected,
    onlineUsers,
    isUserOnline,
  }

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
}

