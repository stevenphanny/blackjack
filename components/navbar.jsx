'use client'
import Link from 'next/link'
import {
  NavigationMenu,
  NavigationMenuList,
  NavigationMenuItem,
  NavigationMenuTrigger,
  NavigationMenuContent,
  NavigationMenuLink,
} from '@/components/ui/navigation-menu'

export default function Navbar() {
  return (
    <nav className="border-b border-neutral-800 px-4 py-2">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
            <NavigationMenuContent className="p-3">
              <ul className="flex flex-col gap-2">
                <li>
                  {/* Use NavigationMenuLink as an <a> directly */}
                  <NavigationMenuLink href="/" className="block px-2 py-1">
                    Game
                  </NavigationMenuLink>
                </li>
                <li>
                  <NavigationMenuLink href="/history" className="block px-2 py-1">
                    History
                  </NavigationMenuLink>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>
    </nav>
  )
}