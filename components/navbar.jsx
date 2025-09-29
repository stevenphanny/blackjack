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

  useEffect(() => {
    const id = getClientId()
    setClientId(id)
    getChips(id).then(setChips).catch(console.error)
  }, [])

  const navItems = [
    { href: '/', label: 'Home' },
    { href: '/history', label: 'History' },
    { href: '/logout', label: 'Logout' },
  ]

  return (
    <nav className="px-5 py-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-6">
            {/* Logo/Brand */}
            <Link href="/" className="text-xl font-bold text-white">
                Blackjack
            </Link>
            
            {/* Buy more chips button */}
            <Button 
              variant="badge" 
              onClick={() => setIsBuyDialogOpen(true)}
            >
              Balance {chips}
            </Button>
        </div>
        

        {/* Desktop Navigation - Hidden on mobile */}
        <div className="hidden md:block md:items-center md:space-x-3">
          {navItems.map((item) => (
            <Button key={item.href} variant="badge" asChild>
              <Link href={item.href}>{item.label}</Link>
            </Button>
          ))}
        </div>

        {/* Mobile Burger Menu - Hidden on desktop */}
        <div className="md:hidden">
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px]">
              <SheetHeader className={"text-lg"}>
                <SheetTitle>Navigation</SheetTitle>
              </SheetHeader>
              <div className="flex flex-col space-y-4 mt-6">
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