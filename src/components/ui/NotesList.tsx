import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  User,
  MessageSquare,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface Note {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  author: {
    name: string;
    avatar?: string;
  };
  isInternal?: boolean;
  metadata?: Record<string, any>;
}

export interface NotesListProps {
  notes: Note[];
  onAddNote?: (content: string) => Promise<void>;
  onUpdateNote?: (id: string, content: string) => Promise<void>;
  onDeleteNote?: (id: string) => Promise<void>;
  canAdd?: boolean;
  canEdit?: (note: Note) => boolean;
  canDelete?: (note: Note) => boolean;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  compact?: boolean;
  showInternal?: boolean;
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  canAdd = true,
  canEdit = () => true,
  canDelete = () => true,
  placeholder = "Add a note...",
  emptyMessage = "No notes yet",
  className,
  compact = false,
  showInternal = true,
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const filteredNotes = showInternal ? notes : notes.filter(note => !note.isInternal);
  const sortedNotes = [...filteredNotes].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || !onAddNote) return;

    setIsLoading(true);
    try {
      await onAddNote(newNoteContent.trim());
      setNewNoteContent("");
      setIsAdding(false);
    } catch (error) {
      console.error("Failed to add note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditNote = async (id: string) => {
    if (!editContent.trim() || !onUpdateNote) return;

    setIsLoading(true);
    try {
      await onUpdateNote(id, editContent.trim());
      setEditingId(null);
      setEditContent("");
    } catch (error) {
      console.error("Failed to update note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!onDeleteNote) return;

    setIsLoading(true);
    try {
      await onDeleteNote(id);
      setDeleteId(null);
    } catch (error) {
      console.error("Failed to delete note:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditContent("");
  };

  const cancelAdding = () => {
    setIsAdding(false);
    setNewNoteContent("");
  };

  return (
    <div className={cn("space-y-4", className)} role="region" aria-label="Notes section">
      {/* Add Note Section */}
      {canAdd && onAddNote && (
        <div className="space-y-3">
          {!isAdding ? (
            <Button
              variant="outline"
              onClick={() => setIsAdding(true)}
              className="w-full justify-start gap-2"
              disabled={isLoading}
              aria-label="Add new note"
            >
              <Plus className="h-4 w-4" />
              Add Note
            </Button>
          ) : (
            <Card>
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <Textarea
                    placeholder={placeholder}
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    className="min-h-[80px] resize-none"
                    disabled={isLoading}
                    aria-label="New note content"
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={cancelAdding}
                      disabled={isLoading}
                      aria-label="Cancel adding note"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleAddNote}
                      disabled={!newNoteContent.trim() || isLoading}
                      aria-label="Save note"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {isLoading ? "Saving..." : "Save Note"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {sortedNotes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{emptyMessage}</p>
          </div>
        ) : (
          sortedNotes.map((note) => (
            <Card key={note.id} className={cn(
              "transition-colors",
              note.isInternal && "border-dashed border-muted-foreground/30"
            )}>
              <CardHeader className={cn(
                "pb-2",
                compact && "pb-1"
              )}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    {note.author.avatar ? (
                      <img
                        src={note.author.avatar}
                        alt={note.author.name}
                        className="w-6 h-6 rounded-full flex-shrink-0"
                      />
                    ) : (
                      <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "font-medium truncate",
                          compact ? "text-sm" : "text-base"
                        )}>
                          {note.author.name}
                        </span>
                        {note.isInternal && (
                          <span className="text-xs bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                            Internal
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <time>
                          {format(note.createdAt, "MMM dd, yyyy 'at' h:mm a")}
                        </time>
                        {note.updatedAt && note.updatedAt > note.createdAt && (
                          <span className="ml-1">(edited)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1">
                    {canEdit(note) && onUpdateNote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(note)}
                        disabled={isLoading || editingId === note.id}
                        className="h-8 w-8 p-0"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                    )}
                    {canDelete(note) && onDeleteNote && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteId(note.id)}
                        disabled={isLoading}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className={cn(
                "pt-0",
                compact && "pb-3"
              )}>
                {editingId === note.id ? (
                  <div className="space-y-3">
                    <Textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="min-h-[80px] resize-none"
                      disabled={isLoading}
                    />
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEditing}
                        disabled={isLoading}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditNote(note.id)}
                        disabled={!editContent.trim() || isLoading}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        {isLoading ? "Saving..." : "Save"}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className={cn(
                    "whitespace-pre-wrap text-sm leading-relaxed",
                    compact && "text-xs"
                  )}>
                    {note.content}
                  </div>
                )}

                {/* Metadata */}
                {note.metadata && Object.keys(note.metadata).length > 0 && (
                  <div className="mt-3 pt-3 border-t border-muted space-y-1">
                    {Object.entries(note.metadata).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="capitalize">
                          {key.replace(/([A-Z])/g, " $1").toLowerCase()}:
                        </span>
                        <span>
                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this note? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteId && handleDeleteNote(deleteId)}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};