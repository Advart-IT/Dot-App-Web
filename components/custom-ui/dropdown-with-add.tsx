"use client"

import type React from "react"
import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronDown, Check, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/custom-ui/button"

interface DropdownOption {
  label: string
  value: string
}

interface SmartDropdownProps {
  options: DropdownOption[]
  value: string | string[]
  onChange: (value: string | string[]) => void
  onChangeComplete?: (value: string | string[]) => void
  placeholder?: string
  label?: string
  required?: boolean
  className?: string
  dropdownClassName?: string
  baseButtonClassName?: string
  disabled?: boolean
  multiSelector?: boolean
  enableSearch?: boolean
  enableAddNew?: boolean
  addNewLabel?: string
  onAddNew?: (newItem: string) => void
  addNewPlaceholder?: string
}

const SmartDropdown: React.FC<SmartDropdownProps> = ({
  options,
  value,
  onChange,
  onChangeComplete,
  placeholder = "Select an option",
  label,
  required = false,
  className = "",
  dropdownClassName = "",
  baseButtonClassName = "",
  disabled = false,
  multiSelector = false,
  enableSearch = false,
  enableAddNew = false,
  addNewLabel = "+ Add New",
  onAddNew,
  addNewPlaceholder = "Enter new item",
}) => {
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [lastCommittedValue, setLastCommittedValue] = useState(value)
  const [hasBeenClosed, setHasBeenClosed] = useState(false)
  const [showAddInput, setShowAddInput] = useState(false)
  const [newItemInput, setNewItemInput] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const addInputRef = useRef<HTMLInputElement>(null)

  const filteredOptions = useMemo(() => {
    let filtered = enableSearch && search 
      ? options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase()))
      : options

    if (hasBeenClosed && !search && multiSelector && !open) {
      const selectedValues = Array.isArray(value) ? value : [value].filter(Boolean)
      
      filtered = filtered.sort((a, b) => {
        const aSelected = selectedValues.includes(a.value)
        const bSelected = selectedValues.includes(b.value)
        
        if (aSelected && !bSelected) return -1
        if (!aSelected && bSelected) return 1
        return 0
      })
    }

    return filtered
  }, [options, search, enableSearch, value, hasBeenClosed, multiSelector, open])

  const selectedValues = Array.isArray(value) ? value : [value].filter(Boolean)
  
  const getDisplayText = () => {
    if (multiSelector) {
      if (selectedValues.length === 0) return placeholder
      if (selectedValues.length === 1) {
        return options.find(opt => opt.value === selectedValues[0])?.label || placeholder
      }
      return `${selectedValues.length} items selected`
    } else {
      return options.find((opt) => opt.value === value)?.label || placeholder
    }
  }

  const selectedLabel = getDisplayText()

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        if (open) {
          setHasBeenClosed(true)
        }
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [open])

  useEffect(() => {
    setLastCommittedValue(value)
  }, [])

  useEffect(() => {
    if (open && enableSearch && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [open, enableSearch])

  useEffect(() => {
    setHighlightedIndex(-1)
  }, [filteredOptions])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault()
        setOpen(true)
      }
      return
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0))
        break
      case "ArrowUp":
        e.preventDefault()
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (highlightedIndex >= 0 && filteredOptions[highlightedIndex]) {
          handleSelect(filteredOptions[highlightedIndex].value)
        }
        break
      case "Escape":
        e.preventDefault()
        if (open) {
          setHasBeenClosed(true)
        }
        setOpen(false)
        setSearch("")
        break
    }
  }

  const handleSelect = (newValue: string) => {
    if (multiSelector) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : [])
      const newValues = currentValues.includes(newValue)
        ? currentValues.filter(v => v !== newValue)
        : [...currentValues, newValue]
      
      onChange(newValues)
      
      if (JSON.stringify(newValues) !== JSON.stringify(lastCommittedValue) && onChangeComplete) {
        onChangeComplete(newValues)
        setLastCommittedValue(newValues)
      }
    } else {
      setHasBeenClosed(true)
      setOpen(false)
      setSearch("")
      onChange(newValue)

      if (newValue !== lastCommittedValue && onChangeComplete) {
        onChangeComplete(newValue)
        setLastCommittedValue(newValue)
      }
    }
  }

  const handleRemoveTag = (valueToRemove: string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (multiSelector) {
      const currentValues = Array.isArray(value) ? value : (value ? [value] : [])
      const newValues = currentValues.filter(v => v !== valueToRemove)
      onChange(newValues)
      
      if (onChangeComplete) {
        onChangeComplete(newValues)
        setLastCommittedValue(newValues)
      }
    }
  }

  const isSelected = (optionValue: string) => {
    if (multiSelector) {
      return selectedValues.includes(optionValue)
    }
    return value === optionValue
  }

  const handleOpenDropdown = () => {
    if (!disabled) {
      setOpen((prev) => !prev)
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = e.target.value
    setSearch(newSearch)
    setHighlightedIndex(0)
  }

  const handleAddNewClick = () => {
    setShowAddInput(true)
    setNewItemInput("")
    setTimeout(() => {
      addInputRef.current?.focus()
    }, 0)
  }

  const handleSaveNewItem = () => {
    if (newItemInput.trim() && onAddNew) {
      onAddNew(newItemInput.trim())
      setNewItemInput("")
      setShowAddInput(false)
      setOpen(false)
    }
  }

  const handleCancelAddNew = () => {
    setShowAddInput(false)
    setNewItemInput("")
  }

  const handleAddInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      handleSaveNewItem()
    } else if (e.key === "Escape") {
      e.preventDefault()
      handleCancelAddNew()
    }
  }

  return (
    <div className={cn("relative w-full", className)} ref={containerRef}>
      {label && (
        <label className="block text-12 font-normal text-ltxt mb-x2">
          {label}
          {required && <span className="text-dng ml-x2">*</span>}
        </label>
      )}

      <Button
        variant="outline"
        onClick={handleOpenDropdown}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className={cn(
          "flex py-x8 w-full justify-between items-center min-h-[40px]",
          "placeholder:text-dtxt-d disabled:cursor-not-allowed disabled:opacity-50",
          baseButtonClassName,
        )}
      >
        <div className="flex-1 flex items-center gap-x4 overflow-hidden min-w-0">
          {multiSelector && selectedValues.length > 0 ? (
            <div className="flex items-center gap-x2 overflow-x-auto max-w-full min-w-0 scrollbar-hide">
              <div className="flex gap-x2 flex-nowrap">
                {selectedValues.map((val) => {
                  const option = options.find(opt => opt.value === val)
                  return option ? (
                    <span
                      key={val}
                      className="inline-flex items-center gap-x2 px-x8 py-x2 bg-link text-themeBase rounded-x4 text-12 whitespace-nowrap flex-shrink-0 max-w-[120px]"
                      title={option.label}
                    >
                      <span className="truncate max-w-[80px]">{option.label}</span>
                      <X 
                        className="h-3 w-3 cursor-pointer hover:bg-black/20 rounded flex-shrink-0"
                        onClick={(e: React.MouseEvent) => handleRemoveTag(val, e)}
                      />
                    </span>
                  ) : null
                })}
              </div>
            </div>
          ) : (
            <span 
              className={cn(
                "block truncate text-left min-w-0 flex-1",
                (multiSelector ? selectedValues.length > 0 : value) ? "text-dtxt-d" : "text-ltxt-l"
              )}
              title={selectedLabel}
            >
              {selectedLabel}
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 opacity-50 transition-transform duration-200 flex-shrink-0 ml-x2",
            open && "rotate-180"
          )}
        />
      </Button>

      {open && (
        <div
          className={cn(
            "absolute z-50 w-full overflow-hidden rounded-md border border-bathemeBasese-l2 bg-themeBase shadow-md",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            "data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[side=bottom]:slide-in-from-top-2",
            dropdownClassName,
          )}
          data-state="open"
          data-side="bottom"
        >
          <div className="text-14 space-y-x4 p-x4 max-h-64 overflow-y-auto">
            {enableSearch && (
              <div className="relative">
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search..."
                  value={search}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  className="w-full px-x8 py-x4 text-14 bg-bthemeBasease-l1 rounded-x4 focus:outline-none text-dtxt-d"
                />
              </div>
            )}

            {filteredOptions.length === 0 ? (
              <div className="px-x2 py-x2 text-ltxt-l text-center">
                {enableSearch && search ? "No results found" : "No options available"}
              </div>
            ) : (
              <>
                {multiSelector && (
                  <div className="border-b border-bathemeBasese-l2 pb-x4 mb-x4">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          const currentValues = Array.isArray(value) ? value : (value ? [value] : [])
                          const filteredValues = filteredOptions.map(opt => opt.value)
                          const newValues = [...new Set([...currentValues, ...filteredValues])]
                          onChange(newValues)
                          if (onChangeComplete) {
                            onChangeComplete(newValues)
                            setLastCommittedValue(newValues)
                          }
                        }}
                        className="text-12 text-link hover:text-link/80 transition-colors"
                      >
                        Select all ({filteredOptions.length})
                      </button>
                      {selectedValues.length > 0 && (
                        <button
                          onClick={() => {
                            onChange([])
                            if (onChangeComplete) {
                              onChangeComplete([])
                              setLastCommittedValue([])
                            }
                          }}
                          className="text-12 text-link hover:text-link/80 transition-colors"
                        >
                          Clear all ({selectedValues.length})
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                {filteredOptions.map((opt, index) => {
                  const isHighlighted = index === highlightedIndex
                  const isOptionSelected = isSelected(opt.value)

                  return (
                    <div
                      key={opt.value}
                      onClick={() => handleSelect(opt.value)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseLeave={() => setHighlightedIndex(-1)}
                      className={cn(
                        "relative flex w-full cursor-pointer items-center rounded-x4 py-x4 pr-x8",
                        multiSelector ? "pl-x30" : "pl-x8",
                        "transition-colors duration-200",
                        isOptionSelected && "bg-link text-themeBase",
                        isHighlighted && !isOptionSelected && "bg-themeBase-l1",
                        !isHighlighted && !isOptionSelected && "text-dtxt-d hover:bg-lbl",
                      )}
                      title={opt.label} 
                    >
                      {multiSelector && (
                        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                          {isOptionSelected && <Check className="h-4 w-4" />}
                        </span>
                      )}
                      <span className="block truncate min-w-0 flex-1">
                        {opt.label}
                      </span>
                    </div>
                  )
                })}
                
                {/* Add New Item Section */}
                {enableAddNew && (
                  <div className="border-t border-themeBase-l2 pt-x4 mt-x4">
                    {!showAddInput ? (
                      <div
                        onClick={handleAddNewClick}
                        className="flex w-full cursor-pointer items-center rounded-x4 py-x4 px-x8 text-dtxt-d hover:bg-lbl transition-colors duration-200"
                      >
                        <span className="text-link font-medium">{addNewLabel}</span>
                      </div>
                    ) : (
                      <div className="space-y-x8">
                        <input
                          ref={addInputRef}
                          type="text"
                          value={newItemInput}
                          onChange={(e) => setNewItemInput(e.target.value)}
                          onKeyDown={handleAddInputKeyDown}
                          placeholder={addNewPlaceholder}
                          className="w-full px-x8 py-x4 text-14 bg-themeBase-l1 border border-themeBase-l2 rounded-x4 focus:outline-none focus:ring-2 focus:ring-link text-dtxt-d"
                        />
                        <div className="flex gap-x8">
                          <Button
                            onClick={handleSaveNewItem}
                            disabled={!newItemInput.trim()}
                            variant="primary"
                            size="s"
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelAddNew}
                            variant="outline"
                            size="s"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default SmartDropdown