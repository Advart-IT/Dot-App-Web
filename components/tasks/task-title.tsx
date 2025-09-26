"use client"

import { useState, useRef, useEffect } from "react"

interface TaskTitleProps {
  name: string
  onChange: (value: string) => void
  onSave: (value: string) => void
}

export function TaskTitle({ name, onChange, onSave }: TaskTitleProps) {
  const [isFocused, setIsFocused] = useState(false)
  const [hasSaved, setHasSaved] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-expand height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }, [name])

  const handleSave = (value: string) => {
    if (isSaving) return

    setIsSaving(true)
    onSave(value)
    setHasSaved(true)
    setIsSaving(false)
  }

  return (
    <div className="mb-2 relative">
      <textarea
        ref={textareaRef}
        className="w-full resize-none overflow-hidden text-3xl font-semibold px-0
          border-none outline-none focus:border-none focus:outline-none shadow-none transition-all leading-tight"
        placeholder="Task Name"
        value={name}
        rows={1}
        required
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => {
          setIsFocused(true)
          setHasSaved(false) // Reset save tracking when user focuses
        }}
        onBlur={(e) => {
          setIsFocused(false)
          if (!hasSaved && !isSaving) {
            handleSave(e.target.value)
          }
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSave(e.currentTarget.value)
            e.currentTarget.blur()
          }
        }}
      />
    </div>
  )
}
