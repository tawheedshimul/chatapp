import { formatDistanceToNow } from "date-fns"
import UserAvatar from "./UserAvatar"

const MessageBubble = ({ message, isOwnMessage }) => {
  const formattedTime = formatDistanceToNow(new Date(message.createdAt), {
    addSuffix: true,
  })

  return (
    <div className={`flex items-start ${isOwnMessage ? "justify-end" : "justify-start"}`}>
      {!isOwnMessage && (
        <div className="mr-2 flex-shrink-0">
          <UserAvatar user={message.sender} size="small" />
        </div>
      )}
      <div
        className={`max-w-[70%] rounded-lg px-4 py-2 ${
          isOwnMessage
            ? "bg-blue-600 text-white dark:bg-blue-700"
            : "bg-white text-gray-900 dark:bg-gray-800 dark:text-white shadow-sm"
        }`}
      >
        <p className="text-sm break-words">{message.text}</p>
        <p
          className={`mt-1 text-right text-xs  ${
            isOwnMessage ? "text-blue-200 dark:text-blue-300" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {formattedTime}
        </p>
      </div>
    </div>
  )
}

export default MessageBubble

