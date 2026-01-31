import { Sidebar } from '@/components/ui/Sidebar';
import { MobileNav } from '@/components/ui/MobileNav';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-950">
            {/* Desktop Sidebar */}
            <Sidebar />

            {/* Mobile Navigation */}
            <MobileNav />

            {/* Main content area - padding for mobile top bar and desktop sidebar */}
            <main className="pt-16 lg:pt-0 lg:pl-64">
                {children}
            </main>
        </div>
    );
}
