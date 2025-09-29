'use client'
import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { getClientId, getChips, apiBuyChips } from '@/lib/storage'

import {
AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"


export default function Home() {
  // clientId stores unique id per browser. setClientId is inbuilt React state setter
  const [clientId, setClientId] = useState('')
  // chips stores current balance of chips from DB. setChips is inbuilt React state setter
  const [chips, setChips] = useState(0)

  useEffect(() => {
    const id = getClientId()
    setClientId(id)
    getChips(id).then(setChips).catch(console.error)
  }, [])

  // Refresh chips when chips are purchased from navbar dialog
  useEffect(() => {
    const refreshChips = () => {
      if (clientId) {
        getChips(clientId).then(setChips).catch(console.error)
      }
    }

    // Listen for custom chip update event
    window.addEventListener('chipsUpdated', refreshChips)
    // Also listen for window focus as backup
    window.addEventListener('focus', refreshChips)
    
    return () => {
      window.removeEventListener('chipsUpdated', refreshChips)
      window.removeEventListener('focus', refreshChips)
    }
  }, [clientId])

  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-white my-6">Blackjack</h1>

      <div className="text-center space-y-2">
        <p className="text-lg">Client ID: <code>{clientId}</code></p>
        <p className="text-2xl font-semibold">Chips: {chips}</p>
      </div>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Show Dialog</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account
              and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}