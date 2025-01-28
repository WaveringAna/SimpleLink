import { SiGithub, SiBluesky } from "@icons-pack/react-simple-icons"
import { Button } from "@/components/ui/button"
import { useState } from 'react'
import { PrivacyModal } from './PrivacyModal'

export function Footer() {
    const [privacyModalOpen, setPrivacyModalOpen] = useState(false)

    const handlePrivacyModalOpen = () => {
        setPrivacyModalOpen(true)
    }

    const handlePrivacyModalClose = () => {
        setPrivacyModalOpen(false)
    }

    return (
        <footer className="border-t">
            <div className="container max-w-6xl mx-auto flex h-14 items-center justify-between px-4">
                <p className="text-sm text-muted-foreground">Created by waveringana</p>
                <div className="flex items-center space-x-4">
                    <nav className="flex items-center space-x-4">
                        <a
                            onClick={handlePrivacyModalOpen}
                            href="#"
                        >
                            Privacy
                        </a>
                    </nav>
                    <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="icon">
                            <a href="https://l.nekomimi.pet/github?source=shortener" target="_blank" rel="noopener noreferrer">
                                <SiGithub className="h-4 w-4" />
                            </a>
                            <span className="sr-only">GitHub</span>
                        </Button>

                        <Button variant="ghost" size="icon">
                            <a href="https://l.nekomimi.pet/twitter?source=shortener" target="_blank" rel="noopener noreferrer">
                                <SiBluesky className="h-4 w-4" />
                            </a>
                            <span className="sr-only">Twitter</span>
                        </Button>
                    </div>
                </div>
            </div>

            <PrivacyModal
                isOpen={privacyModalOpen}
                onClose={handlePrivacyModalClose}
            />
        </footer>
    )
}
