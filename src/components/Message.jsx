function Message({ message, own, otherUser }) {
    return (
      <div className={`flex mb-4 ${own ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${own ? 'bg-blue-500 text-white' : 'bg-white border border-gray-200'}`}>
          {!own && (
            <div className="font-medium text-xs text-gray-500 mb-1">
              {otherUser?.username}
            </div>
          )}
          <p className={own ? 'text-white' : 'text-gray-800'}>{message.text}</p>
          <div className={`text-xs mt-1 ${own ? 'text-blue-100' : 'text-gray-500'}`}>
            {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    );
  }
  
  export default Message;