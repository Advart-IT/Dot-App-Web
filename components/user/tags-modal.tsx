'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '@/components/custom-ui/button2';
import SmartInputBox from '@/components/custom-ui/input-box';
import { addNewTag } from '@/lib/user/user';
import { useUser } from '@/hooks/usercontext';

interface TagsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  onError: (error: string) => void;
}

export default function TagsModal({
  isOpen,
  onClose,
  selectedTags,
  onTagsChange,
  onError
}: TagsModalProps) {
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [newTagValue, setNewTagValue] = useState('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [tempSelectedTags, setTempSelectedTags] = useState<string[]>([]);
  const [showAddInput, setShowAddInput] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize temp selected tags when modal opens
  useEffect(() => {
    if (isOpen) {
      setTempSelectedTags([...selectedTags]);
      setSearchQuery('');
      setNewTagValue('');
      setIsAddingNew(false);
      setShowAddInput(false);
    }
  }, [isOpen, selectedTags]);

  // Focus input when add input is shown
  useEffect(() => {
    if (showAddInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showAddInput]);

  // Get all available tags (user context + local)
  const allAvailableTags = useMemo(() => {
    const userTags = user?.dropdowns?.tags || [];
    return [...new Set([...userTags, ...localTags])];
  }, [user?.dropdowns?.tags, localTags]);

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) {
      return [...allAvailableTags, '+ add'];
    }
    return allAvailableTags.filter(tag =>
      tag.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allAvailableTags, searchQuery]);

  const handleAddNewTag = async () => {
    if (!newTagValue.trim()) return;

    try {
      setIsAddingNew(true);
      
      // Use the library API function
      const result = await addNewTag(newTagValue.trim());
      console.log('New tag added successfully:', result);
      
      // Add the new tag to local state immediately
      setLocalTags(prev => [...prev, newTagValue.trim()]);
      
      // Automatically add the new tag to temp selected tags
      setTempSelectedTags(prev => [...prev, newTagValue.trim()]);
      
      // Clear input and hide input field
      setNewTagValue('');
      setShowAddInput(false);
      
    } catch (error) {
      console.error('Error adding new tag:', error);
      onError(error instanceof Error ? error.message : 'Failed to add new tag');
    } finally {
      setIsAddingNew(false);
    }
  };

  const handleTagClick = (tag: string) => {
    if (tag === '+ add') {
      setShowAddInput(true);
      return;
    }

    setTempSelectedTags(prev => {
      if (prev.includes(tag)) {
        // Remove tag if already selected
        return prev.filter(t => t !== tag);
      } else {
        // Add tag if not selected
        return [...prev, tag];
      }
    });
  };

  const handleSave = () => {
    onTagsChange(tempSelectedTags);
    onClose();
  };

  const handleClose = () => {
    onTagsChange(tempSelectedTags); // Auto-save changes when closing
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if clicking on the backdrop, not the modal content
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddNewTag();
    } else if (e.key === 'Escape') {
      setShowAddInput(false);
      setNewTagValue('');
    }
  };

  const handleCancelInput = () => {
    setShowAddInput(false);
    setNewTagValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleBackdropClick}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Manage Tags</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
          {/* Search Bar */}
          <div className="mb-6 flex justify-center">
            <div className="w-full max-w-md">
              <SmartInputBox
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search tags..."
                label=""
                className="w-full"
              />
            </div>
          </div>

          {/* Available Tags Section */}
          <div className="flex-1 overflow-scroll">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Available Tags</h3>
            
            <div className="overflow-y-auto max-h-96">
              <div className="grid grid-cols-3 gap-3">
                {filteredTags.map((tag, index) => {
                  if (tag === '+ add' && showAddInput) {
                    return (
                      <div 
                        key={`add-input-${index}`} 
                        className="flex items-center gap-1 rounded-md border-2 border-blue-500 bg-blue-50 text-blue-700">
                        <div className="flex-1">
                        <input
                          ref={inputRef}
                          type="text"
                          value={newTagValue}
                          onChange={(e) => setNewTagValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="New tag..."
                          className="w-full bg-transparent border-none focus:outline-none text-sm p-1"
                          autoFocus
                        />
                        </div>
                        <div className="flex gap-1">
                        <Button
                          onClick={handleAddNewTag}
                          disabled={!newTagValue.trim() || isAddingNew}
                          variant="primary"
                          size="s"
                          className="text-xs"
                        >
                          {isAddingNew ? '...' : '✓'}
                        </Button>
                        <Button
                          onClick={handleCancelInput}
                          variant="outline"
                          size="s"
                          className="text-xs"
                        >
                          ✕
                        </Button>
                        </div>
                      </div>
                    );
                  } else if (tag === '+ add') {
                    return (
                      <button
                        key={index}
                        onClick={() => handleTagClick(tag)}
                        className={`
                          flex items-center justify-between p-2 rounded-md border-2 border-dashed transition-all text-left text-sm
                          border-blue-500 bg-blue-50 text-blue-700 hover:bg-blue-100
                        `}
                      >
                        <span className="font-medium text-xs truncate">{tag}</span>
                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ml-1 flex-shrink-0 bg-blue-500 text-white">
                          +
                        </div>
                      </button>
                    );
                  } else {
                    return (
                      <button
                        key={index}
                        onClick={() => handleTagClick(tag)}
                        className={`
                          flex items-center justify-between p-2 rounded-md border-2 transition-all text-left text-sm
                          ${tempSelectedTags.includes(tag)
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                          }
                        `}
                      >
                        <span className="font-medium text-xs truncate">{tag}</span>
                        <div className={`
                          w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold ml-1 flex-shrink-0
                          ${tempSelectedTags.includes(tag)
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-500'
                          }
                        `}>
                          {tempSelectedTags.includes(tag) ? '✓' : '+'}
                        </div>
                      </button>
                    );
                  }
                })}
              </div>

              {filteredTags.length === 1 && filteredTags[0] === '+ add' && (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery.trim() ? 'No tags found matching your search.' : 'No tags available.'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-center gap-3 p-6 border-t bg-gray-50">
          <Button
            onClick={handleSave}
            variant="primary"
            size="m"
          >
            Save Tags ({tempSelectedTags.length})
          </Button>
        </div>
      </div>
    </div>
  );
}