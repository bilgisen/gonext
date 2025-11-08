'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BannerCTA() {
  return (
    <section className="bg-card/70 text-foreground flex flex-col md:flex-row items-center justify-between overflow-hidden rounded-2xl shadow-lg">
      {/* Left: Video */}
      <div className="w-full md:w-1/2">
        <video
          src="https://res.cloudinary.com/daa8dnuhr/video/upload/v1758989057/turasas-n_mcx4lf.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover"
        />
      </div>

      {/* Right: Text & CTA */}
      <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col items-start justify-center space-y-6">
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-semibold leading-snug"
        >
          <span className="text-amber-600">Expostep</span> is your trusted partner for{' '}
          <span className="text-amber-600">trade fairs</span> in Turkey, Europe
          and the MENA region.
        </motion.h2>

        <Button
          asChild
          className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-6 py-3 rounded-xl shadow-md transition-all"
        >
          <Link href="https://expostep.com" target="_blank">
            Get Quote
          </Link>
        </Button>
      </div>
    </section>
  );
}
