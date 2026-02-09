'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAddress } from 'viem'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'

export function NftSearch() {
    const [address, setAddress] = useState('')
    const [error, setError] = useState('')
    const router = useRouter()

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!address.trim()) {
            setError('Please enter an address')
            return
        }

        if (!isAddress(address)) {
            setError('Invalid Ethereum address')
            return
        }

        router.push(`/registry/${address}`)
    }

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-xl space-y-4">
            <div className="flex gap-3">
                <div className="flex-1">
                    <Input
                        type="text"
                        placeholder="Enter Artifact Registry address (0x...)"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="h-12 text-base bg-background/50 border-border/50"
                    />
                </div>
                <Button type="submit" size="lg" className="h-12 px-6">
                    <Search className="w-4 h-4 mr-2" />
                    Explore
                </Button>
            </div>
            {error && (
                <p className="text-sm text-destructive">{error}</p>
            )}
        </form>
    )
}
