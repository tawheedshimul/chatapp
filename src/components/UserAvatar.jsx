const UserAvatar = ({ user, size = "medium" }) => {
  const sizeClasses = {
    small: "h-8 w-8 text-xs",
    medium: "h-10 w-10 text-sm",
    large: "h-12 w-12 text-base",
  }

  const getInitials = (username) => {
    return username ? username.charAt(0).toUpperCase() : "?"
  }

  const getRandomColor = (username) => {
    const colors = [
      "bg-blue-500",
      "bg-green-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500",
      "bg-cyan-500",
    ]

    const index = username ? username.charCodeAt(0) % colors.length : 0
    return colors[index]
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full ${sizeClasses[size]} ${getRandomColor(
        user?.username,
      )} text-white font-medium shadow-sm`}
    >
      {user?.avatar || getInitials(user?.username)}
    </div>
  )
}

export default UserAvatar

