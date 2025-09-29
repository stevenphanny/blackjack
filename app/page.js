'use client'
import { useEffect, useState } from 'react'
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

import { getClientId, getChips, apiBuyChips } from '@/lib/storage'

export default function Home() {
  const [clientId, setClientId] = useState('')
  const [chips, setChips] = useState(0)

  useEffect(() => {
    const id = getClientId()
    setClientId(id)
    getChips(id).then(setChips).catch(console.error)
  }, [])

  async function buy200() {
    try {
      const newBal = await apiBuyChips({ clientId, amount: 200 })
      setChips(newBal)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-4xl font-bold text-white mb-6">
        🎉 Tailwind + shadcn/ui + Supabase are Working!
      </h1>

      <div className="text-center space-y-2">
        <p className="text-lg">Client ID: <code>{clientId}</code></p>
        <p className="text-2xl font-semibold">Chips: {chips}</p>
        <Button onClick={buy200}>Buy +200</Button>
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