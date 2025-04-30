"use client";

import {
  UserNote,
  deleteUserNote,
  getNotesForArticle,
  saveUserNote,
} from "@/lib/indexeddb";
import { PencilIcon, PlusIcon, SaveIcon, TrashIcon } from "lucide-react";
import { useEffect, useState } from "react";

interface UserNoteSectionProps {
  articleId: string;
  nodeId: string;
  concept: string;
}

const UserNoteSection: React.FC<UserNoteSectionProps> = ({
  articleId,
  nodeId,
  concept,
}) => {
  const [notes, setNotes] = useState<UserNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState("");

  useEffect(() => {
    loadNotes();
  }, [articleId]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const articleNotes = await getNotesForArticle(articleId);
      setNotes(articleNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim()) return;

    try {
      const newNote: UserNote = {
        id: `${articleId}-${Date.now()}`,
        articleId,
        nodeId,
        concept,
        content: newNoteContent,
        timestamp: Date.now(),
      };

      await saveUserNote(newNote);
      setNewNoteContent("");
      setIsAddingNote(false);
      await loadNotes(); // Reload notes to show the new one
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleEditNote = (note: UserNote) => {
    setEditingNoteId(note.id);
    setEditedContent(note.content);
  };

  const handleSaveEdit = async (noteId: string) => {
    if (!editedContent.trim()) return;

    try {
      const noteToUpdate = notes.find((note) => note.id === noteId);
      if (noteToUpdate) {
        const updatedNote: UserNote = {
          ...noteToUpdate,
          content: editedContent,
          timestamp: Date.now(), // Update timestamp
        };

        await saveUserNote(updatedNote);
        setEditingNoteId(null);
        await loadNotes(); // Reload notes to show changes
      }
    } catch (error) {
      console.error("Error updating note:", error);
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    try {
      await deleteUserNote(noteId, concept);
      await loadNotes(); // Reload notes without the deleted one
    } catch (error) {
      console.error("Error deleting note:", error);
    }
  };

  // Format date from timestamp
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="mt-4 text-center text-slate-400">Loading notes...</div>
    );
  }

  return (
    <div className="mt-6 rounded-md bg-slate-700/30 p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-md font-medium text-slate-200">Your Notes</h3>
        {!isAddingNote && (
          <button
            onClick={() => setIsAddingNote(true)}
            className="flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500"
          >
            <PlusIcon size={14} className="mr-1" />
            Add Note
          </button>
        )}
      </div>

      {/* Add Note Form */}
      {isAddingNote && (
        <div className="mb-4">
          <textarea
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
            placeholder="Type your note here..."
            className="mb-2 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
            rows={4}
          />
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setIsAddingNote(false)}
              className="rounded-md bg-slate-600 px-3 py-1 text-xs font-medium text-white hover:bg-slate-500"
            >
              Cancel
            </button>
            <button
              onClick={handleAddNote}
              className="flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500"
            >
              <SaveIcon size={14} className="mr-1" />
              Save
            </button>
          </div>
        </div>
      )}

      {/* Notes List */}
      {notes.length === 0 && !isAddingNote ? (
        <p className="text-center text-sm text-slate-400">
          No notes yet. Add one to get started.
        </p>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="rounded-md bg-slate-700 p-3">
              {editingNoteId === note.id ? (
                <div>
                  <textarea
                    value={editedContent}
                    onChange={(e) => setEditedContent(e.target.value)}
                    className="mb-2 w-full rounded-md border border-slate-600 bg-slate-800 p-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                    rows={4}
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setEditingNoteId(null)}
                      className="rounded-md bg-slate-600 px-3 py-1 text-xs font-medium text-white hover:bg-slate-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSaveEdit(note.id)}
                      className="flex items-center rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500"
                    >
                      <SaveIcon size={14} className="mr-1" />
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {formatDate(note.timestamp)}
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditNote(note)}
                        className="rounded-full p-1 text-slate-400 hover:bg-slate-600 hover:text-white"
                        title="Edit note"
                      >
                        <PencilIcon size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="rounded-full p-1 text-slate-400 hover:bg-slate-600 hover:text-white"
                        title="Delete note"
                      >
                        <TrashIcon size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="mt-1 whitespace-pre-wrap text-sm text-slate-200">
                    {note.content}
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UserNoteSection;
