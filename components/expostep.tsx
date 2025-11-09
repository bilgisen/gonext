'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function BannerCTA() {
  return (
    <section className="bg-card/20 text-foreground flex flex-col items-center overflow-hidden rounded-2xl shadow-lg">
      {/* Video Section */}
      <div className="w-full">
        <video
          src="https://res.cloudinary.com/daa8dnuhr/video/upload/v1758989057/turasas-n_mcx4lf.mp4"
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto object-cover"
        />
      </div>

      {/* Text & CTA Section */}
      <div className="w-full p-6 flex flex-col items-center text-center space-y-4">
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          viewport={{ once: true }}
          className="text-lg font-medium leading-snug mt-2"
        >
          <span className="text-amber-500">Expostep</span> is your trusted partner for{' '}
          trade fairs in Turkey, Europe
          and the MENA region.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut', delay: 0.2 }}
          viewport={{ once: true }}
          className="w-full flex justify-center"
        >
          <Button
            asChild
            className="bg-amber-600 hover:bg-amber-500 text-white font-medium px-6 py-3 rounded-xl shadow-md transition-all w-full md:w-auto"
          >
            <Link href="https://expostep.com" target="_blank">
              Get Quote
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
