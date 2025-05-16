import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/lib/utils';
import Button from '@/components/ui/Button';

// Define comment interface
interface ServiceComment {
  id: number;
  serviceId: number;
  userId: number;
  userName: string;
  userRole: string;
  message: string;
  createdAt: string;
  attachmentUrl?: string;
}

interface ServiceCommentsProps {
  serviceId: number;
  comments: ServiceComment[];
  onAddComment: (message: string, file?: File) => Promise<void>;
  isLoading?: boolean;
}

export default function ServiceComments({
  serviceId,
  comments,
  onAddComment,
  isLoading = false,
}: ServiceCommentsProps) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<File | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim()) return;
    
    try {
      setIsSubmitting(true);
      await onAddComment(message, attachment);
      setMessage('');
      setAttachment(undefined);
      
      // Reset file input
      const fileInput = document.getElementById('commentAttachment') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setAttachment(e.target.files[0]);
    } else {
      setAttachment(undefined);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">التعليقات والمتابعة</h2>

      {/* Comment list */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center py-4">
            <svg
              className="animate-spin h-6 w-6 text-primary-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            لا توجد تعليقات حتى الآن.
          </div>
        ) : (
          comments.map((comment) => (
            <div 
              key={comment.id} 
              className={`bg-gray-50 p-4 rounded-lg border ${
                comment.userRole === 'admin' || comment.userRole === 'manager'
                  ? 'border-blue-200'
                  : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                    comment.userRole === 'admin' ? 'bg-primary-600' : 
                    comment.userRole === 'manager' ? 'bg-blue-600' : 
                    'bg-gray-600'
                  }`}>
                    {comment.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="mr-2">
                    <p className="text-sm font-medium text-gray-900">{comment.userName}</p>
                    <p className="text-xs text-gray-500">
                      {comment.userRole === 'admin' ? 'مدير النظام' : 
                       comment.userRole === 'manager' ? 'مدير العقار' : 
                       'مستأجر'}
                    </p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
              </div>
              <div className="mt-2 text-sm text-gray-700">
                <p className="whitespace-pre-line">{comment.message}</p>
              </div>
              {comment.attachmentUrl && (
                <div className="mt-2">
                  <a
                    href={comment.attachmentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
                  >
                    <svg className="ml-1 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    عرض المرفق
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="mb-3">
          <label htmlFor="commentMessage" className="block text-sm font-medium text-gray-700 mb-1">
            إضافة تعليق
          </label>
          <textarea
            id="commentMessage"
            name="message"
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="اكتب تعليقك أو استفسارك هنا..."
            className="shadow-sm focus:ring-primary-500 focus:border-primary-500 block w-full sm:text-sm border-gray-300 rounded-md"
            required
          />
        </div>
        <div className="mb-3">
          <label htmlFor="commentAttachment" className="block text-sm font-medium text-gray-700 mb-1">
            إرفاق ملف (اختياري)
          </label>
          <input
            id="commentAttachment"
            name="attachment"
            type="file"
            onChange={handleFileChange}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            isLoading={isSubmitting}
          >
            إرسال
          </Button>
        </div>
      </form>
    </div>
  );
}
