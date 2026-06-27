import React, { useState } from 'react';
import { Clock, ChevronDown, ChevronUp } from 'lucide-react';

const TimePicker = ({ value, onChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);
  
  const timePresets = [
    '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00'
  ];

  const formatTime = (time) => {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const handlePresetClick = (time) => {
    onChange({ target: { name: label, value: time } });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <input
          type="time"
          value={value}
          onChange={onChange}
          name={label}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="px-3 py-2 bg-blue-50 text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-100 transition duration-200 flex items-center gap-1"
        >
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">Quick</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 mt-2 p-3 bg-white border border-gray-200 rounded-lg shadow-lg">
          <p className="text-xs text-gray-500 mb-2 font-medium">Quick Select:</p>
          <div className="grid grid-cols-2 gap-2">
            {timePresets.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => handlePresetClick(time)}
                className="px-3 py-2 text-sm text-left border border-gray-200 rounded hover:bg-blue-50 hover:border-blue-300 transition duration-150"
              >
                {formatTime(time)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
