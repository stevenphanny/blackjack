'use client'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import BuyChipsDialog from './buy-chips-dialog'
import { getClientId, getChips } from '@/lib/storage'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuLink,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isBuyDialogOpen, setIsBuyDialogOpen] = useState(false)
  const [clientId, setClientId] = useState('')
  const [chips, setChips] = useState(0)

    // On mount, get client ID and initial chips
  useEffect(() => {
    const id = getClientId()
    setClientId(id)
    getChips(id).then(setChips).catch(console.error)
  }, [])

  // Listen for chip updates from game or other sources
  useEffect(() => {
    const refreshChips = () => {
      if (clientId) {
        getChips(clientId).then(setChips).catch(console.error)
      }
    }
    // Listen for custom chip update event or window focus (backup)
    window.addEventListener('chipsUpdated', refreshChips)
    window.addEventListener('focus', refreshChips)
    
    return () => {
      window.removeEventListener('chipsUpdated', refreshChips)
      window.removeEventListener('focus', refreshChips)
    }
  }, [clientId]) // React rule: If effect uses a variable, it must be in dependency array

    // Navigation items
  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/history', label: 'History' },
  ]

  return (
    <nav className="px-5 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
            {/* Website Logo/ Name */}
            <Link href="/" className="text-xl font-bold text-white">
                Blackjack
            </Link>
            
            {/* Balance display and Add chips button */}
            <div className="flex items-center space-x-2">
              <div className="px-3 py-2 mr-0 bg-neutral-800 text-white rounded-full text-sm font-semibold">
                Balance {chips}
              </div>
              <Button key="buy-chips" variant="circular-hollow" onClick={() => setIsBuyDialogOpen(true)}>
                Add Chips
              </Button>
            </div>
        </div>
        

        {/* 
          DESKTOP NAVIGATION 
          - Shows horizontal buttons on screens ≥768px (md breakpoint)
          - Hidden on mobile with "hidden" class (display: none by default)  
          - "md:block" overrides hidden on medium+ screens (display: block)
          - "md:items-center md:space-x-3" adds flexbox alignment and spacing on desktop
        */}
        <div className="hidden md:block md:items-center md:space-x-3">
          {navItems.map((item) => (
            <Button key={item.href} variant="badge" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>

        {/* 
          MOBILE BURGER MENU
          - Shows hamburger menu on screens <768px (mobile)
          - "md:hidden" hides this entire section on desktop screens ≥768px
          - Uses Sheet component for slide-out drawer navigation
        */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                {/* Menu icon from Lucide React (hamburger lines) */}
                <Menu className="h-6 w-6" />
                {/* Screen reader text for accessibility */}
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            
            <SheetContent side="right" className="w-[300px]">
              {/* Header section of the drawer */}
              <SheetHeader className={"text-lg"}>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              
              {/* 
                Navigation links container
                - flex-col: Stack links vertically
                - space-y-4: 16px vertical spacing between links
                - mt-6: 24px top margin
              */}
              <div className="flex flex-col space-y-4 mt-6">
                {/* Loop for each link */}
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-s text-white mx-4 font-medium hover:text-primary transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label} 
                  </Link>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Buy Chips Dialog */}
      <BuyChipsDialog
        isOpen={isBuyDialogOpen}
        onOpenChange={setIsBuyDialogOpen}
        clientId={clientId}
        currentChips={chips}
        onChipsUpdate={setChips}
      />
    </nav>
  )
}