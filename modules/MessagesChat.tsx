
import React from 'react';

const MessagesChat: React.FC = () => {
  return (
    <div className="flex flex-col h-[60vh] text-slate-300">
      <h3 className="text-xl font-semibold mb-4 text-white">Live Chat</h3>
      <div className="flex-grow bg-slate-900 border border-slate-700 rounded-lg p-4 flex flex-col space-y-4 overflow-y-auto">
        {/* Chat messages */}
        <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0"></div>
          <div className="bg-slate-700 rounded-lg p-3 max-w-xs">
            <p className="text-sm">Hello! I have a question about my order #12345.</p>
          </div>
        </div>
        <div className="flex items-start gap-2 justify-end">
          <div className="bg-cyan-600 rounded-lg p-3 max-w-xs">
            <p className="text-sm text-white">Of course! Let me pull up your order details. One moment please.</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-cyan-800 flex-shrink-0"></div>
        </div>
         <div className="flex items-start gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0"></div>
          <div className="bg-slate-700 rounded-lg p-3 max-w-xs">
            <p className="text-sm">Thank you!</p>
          </div>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <input
          type="text"
          placeholder="Type your message..."
          className="flex-grow bg-slate-900 border border-slate-700 rounded-md p-2 text-slate-200 focus:ring-cyan-500 focus:border-cyan-500"
        />
        <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
          Send
        </button>
      </div>
    </div>
  );
};

export default MessagesChat;
