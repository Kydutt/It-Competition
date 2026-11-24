import React, { useState } from 'react'
import { ChevronDown } from 'lucide-react'

export interface AccordionItem {
  id: string | number
  title: string
  content: React.ReactNode
  category?: string
}

export interface AccordionProps {
  items: AccordionItem[]
  defaultOpenId?: string | number
  allowMultiple?: boolean
  className?: string
}

export const Accordion: React.FC<AccordionProps> = ({
  items,
  defaultOpenId,
  allowMultiple = false,
  className = '',
}) => {
  const [openIds, setOpenIds] = useState<Set<string | number>>(
    new Set(defaultOpenId !== undefined ? [defaultOpenId] : [])
  )

  const toggle = (id: string | number) => {
    setOpenIds((prev) => {
      const next = new Set(allowMultiple ? prev : [])
      if (prev.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id)
        return (
          <div
            key={item.id}
            className={`border rounded-2xl bg-[#FFFEFA] overflow-hidden transition-all duration-200 ${
              isOpen ? 'border-[#F5C842] shadow-sm' : 'border-[#E9E5DA] hover:border-slate-300'
            }`}
          >
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-semibold text-[#17243A] hover:text-[#E8AD22] focus:outline-none transition-colors cursor-pointer"
            >
              <span className="text-sm sm:text-base font-bold pr-4">{item.title}</span>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                  isOpen ? 'bg-[#FFF4CE] text-[#17243A] rotate-180' : 'bg-[#FAF9F5] text-slate-400'
                }`}
              >
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>
            {isOpen && (
              <div className="px-4 pb-5 sm:px-5 sm:pb-6 text-sm text-[#64748B] border-t border-[#E9E5DA]/60 pt-4 leading-relaxed">
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
