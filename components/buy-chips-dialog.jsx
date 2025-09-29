'use client'
import { useState } from 'react'
import { X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { apiBuyChips } from '@/lib/storage'

export default function BuyChipsDialog({ 
  isOpen, 
  onOpenChange, 
  clientId, 
  currentChips, 
  onChipsUpdate 
}) {
  const [isLoading, setIsLoading] = useState(false)

  const chipOptions = [
    { amount: 100, label: '100 Chips'},
    { amount: 500, label: '500 Chips'},
    { amount: 1000, label: '1000 Chips'},
    { amount: 5000, label: '5000 Chips'},
  ]

  async function handlePurchase(amount) {
    if (!clientId || isLoading) return
    
    setIsLoading(true)
    try {
      const newBalance = await apiBuyChips({ clientId, amount })
      onChipsUpdate(newBalance) // Update parent component's chip count
      
      // Dispatch custom event to notify other components (like home page)
      window.dispatchEvent(new CustomEvent('chipsUpdated', { 
        detail: { newBalance, clientId } 
      }))
      
      onOpenChange(false) // Close dialog immediately
    } catch (error) {
      console.error('Failed to buy chips:', error)
      alert('Failed to buy chips. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        {/* Close X button */}
        <Button
          variant="default"
          size="icon"
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </Button>

        <AlertDialogHeader>
          <AlertDialogTitle>Buy More Chips</AlertDialogTitle>
          <AlertDialogDescription>
            Current balance: <strong>{currentChips} chips</strong>
            
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid grid-cols-2 gap-3 my-4">
          {chipOptions.map((option) => (
            <Button
              key={option.amount}
              variant="outline"
              onClick={() => handlePurchase(option.amount)}
              disabled={isLoading}
              className="flex flex-col h-auto py-3 hover:bg-primary hover:text-primary-foreground"
            >
              <span className="font-semibold">{option.label}</span>
            </Button>
          ))}
        </div>

      </AlertDialogContent>
    </AlertDialog>
  )
}
