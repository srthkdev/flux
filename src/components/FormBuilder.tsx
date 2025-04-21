'use client'

import { useState } from 'react'
import { useFormStore, type FormField, type FieldType } from '@/store/form'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { DragDropContext, Droppable, Draggable, type DropResult, type DroppableProvided, type DraggableProvided } from '@hello-pangea/dnd'

const fieldTypeIcons: Record<FieldType, string> = {
  shortText: '✏️',
  longText: '📝',
  number: '🔢',
  email: '📧',
  phone: '📱',
  date: '📅',
  select: '📋',
  multiSelect: '☑️',
  checkbox: '✅',
  radio: '⭕',
  fileUpload: '📎'
}

export function FormBuilder() {
  const { fields, title, description, addField, updateField, removeField, reorderFields, updateFormMeta } = useFormStore()
  const [editingField, setEditingField] = useState<string | null>(null)

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return
    reorderFields(result.source.index, result.destination.index)
  }

  const renderField = (field: FormField, index: number) => {
    const isEditing = editingField === field.id

    return (
      <Draggable key={field.id} draggableId={field.id} index={index}>
        {(provided: DraggableProvided) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="mb-4"
          >
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span>{fieldTypeIcons[field.type]}</span>
                  {isEditing ? (
                    <Input
                      value={field.label}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateField(field.id, { label: e.target.value })}
                      onBlur={() => setEditingField(null)}
                      autoFocus
                    />
                  ) : (
                    <div
                      className="cursor-pointer hover:text-blue-600"
                      onClick={() => setEditingField(field.id)}
                    >
                      {field.label || 'Untitled Field'}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeField(field.id)}
                >
                  ✕
                </Button>
              </div>
              {field.description && (
                <p className="text-sm text-gray-500 mt-1">{field.description}</p>
              )}
            </Card>
          </div>
        )}
      </Draggable>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-8">
        <Input
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormMeta({ title: e.target.value })}
          className="text-2xl font-bold mb-2 border-none hover:bg-gray-100 px-2 py-1 rounded"
          placeholder="Form Title"
        />
        <Textarea
          value={description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormMeta({ description: e.target.value })}
          className="text-gray-600 border-none hover:bg-gray-100 px-2 py-1 rounded"
          placeholder="Form Description"
        />
      </div>

      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="form-fields">
          {(provided: DroppableProvided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-4"
            >
              {fields.map((field, index) => renderField(field, index))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {fields.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No fields added yet. Use the command menu (Cmd+K) to add fields.
        </div>
      )}
    </div>
  )
} 