'use client'

import { useEffect, useState } from 'react'
import { Command } from 'cmdk'
import { useFormStore, type FieldType } from '@/store/form'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'

const fieldTypes: { value: FieldType; label: string; icon: string }[] = [
  { value: 'shortText', label: 'Short Text', icon: '✏️' },
  { value: 'longText', label: 'Long Text', icon: '📝' },
  { value: 'number', label: 'Number', icon: '🔢' },
  { value: 'email', label: 'Email', icon: '📧' },
  { value: 'phone', label: 'Phone', icon: '📱' },
  { value: 'date', label: 'Date', icon: '📅' },
  { value: 'select', label: 'Select', icon: '📋' },
  { value: 'multiSelect', label: 'Multi Select', icon: '☑️' },
  { value: 'checkbox', label: 'Checkbox', icon: '✅' },
  { value: 'radio', label: 'Radio', icon: '⭕' },
  { value: 'fileUpload', label: 'File Upload', icon: '📎' },
]

export function CmdKPrompt() {
  const [open, setOpen] = useState(false)
  const { addField } = useFormStore()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((open) => !open)
      }
    }

    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  const handleSelect = (value: FieldType) => {
    addField({
      type: value,
      label: '',
      required: false,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="p-0">
        <DialogTitle className="sr-only">Commands</DialogTitle>
        <Command className="rounded-lg border shadow-md">
          <Command.Input placeholder="Type a command or search..." />
          <Command.List>
            <Command.Empty>No results found.</Command.Empty>
            <Command.Group heading="Add Field">
              {fieldTypes.map((type) => (
                <Command.Item
                  key={type.value}
                  value={type.value}
                  onSelect={() => handleSelect(type.value)}
                  className="flex items-center gap-2 px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <span>{type.icon}</span>
                  <span>{type.label}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  )
} 