import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/api';
import { AttendanceStatus } from '../types';
import { Clock, Play, Square, Timer } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<AttendanceStatus | null>(null);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchStatus();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchStatus = async () => {
    try {
      const data = await apiService.getAttendanceStatus();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch status:', error);
    }
  };

  const handleCheckIn = async () => {
    setLoading(true);
    try {
      await apiService.checkIn(notes);
      setNotes('');
      await fetchStatus();
    } catch (error) {
      alert('Failed to check in');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setLoading(true);
    try {
      await apiService.checkOut(notes);
      setNotes('');
      await fetchStatus();
    } catch (error) {
      alert('Failed to check out');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      timeZone: 'America/New_York',
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };


  //   const getHoursWorked = () => {
  //   if (!status?.checkIn) return '0:00:00';
  //   const checkInTime = new Date(status.checkIn);
  //   const endTime = status.checkOut ? new Date(status.checkOut) : currentTime;
  //   const diffMs = endTime.getTime() - checkInTime.getTime();
  //   const diffSec = Math.floor(diffMs / 1000);
  //   const hours = Math.floor(diffSec / 3600);
  //   const minutes = Math.floor((diffSec % 3600) / 60);
  //   const seconds = diffSec % 60;
  //   return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds
  //     .toString()
  //     .padStart(2, '0')}`;
  // };


  // Correct hours worked calculation (handles UTC properly)
  const getHoursWorked = () => {
    if (!status?.checkIn) return '0:00:00';




    // const hours = Math.floor(duration.asHours());
    // const minutes = duration.minutes();
    // const seconds = duration.seconds();

    return status?.hoursWorked;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {user?.firstName}!
        </h1>
        <p className="text-blue-100 mb-4">{formatDate(currentTime)}</p>
        <div className="flex items-center space-x-2">
          <Clock className="h-6 w-6" />
          <span className="text-2xl font-mono">{formatTime(currentTime)}</span>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-full ${status?.isCheckedIn ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Timer className={`h-6 w-6 ${status?.isCheckedIn ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className="text-2xl font-semibold text-gray-900">
                {status?.isCheckedIn ? 'Checked In' : 'Checked Out'}
              </p>
            </div>
          </div>
        </div>

        {status?.isCheckedIn && (
          <>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-blue-100">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Check In Time</p>
                  <p className="text-1xl font-semibold text-gray-900">
                    {(status.checkIn)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-full bg-orange-100">
                  <Timer className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Hours Worked</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {/* {status.hoursWorked} */}
                    {getHoursWorked()}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Check In/Out Section */}
      <div className="bg-white rounded-lg shadow p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Time Tracking</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optional)
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Add any notes about your work session..."
            />
          </div>

          <div className="flex space-x-4">
            {!status?.isCheckedIn ? (
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Play className="h-5 w-5" />
                <span>{loading ? 'Checking In...' : 'Check In'}</span>
              </button>
            ) : (
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                <Square className="h-5 w-5" />
                <span>{loading ? 'Checking Out...' : 'Check Out'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;