/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Tutorial, Language, translations, City } from '../types';
import TutorialCard from './TutorialCard';
import { motion, AnimatePresence } from 'motion/react';
import { Inbox } from 'lucide-react';

interface TutorialListProps {
  tutorials: Tutorial[];
  lang: Language;
}

export default function TutorialList({ tutorials, lang }: TutorialListProps) {
  const t = translations[lang];

  if (tutorials.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-500 space-y-4">
        <div className="p-6 rounded-3xl bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10">
          <Inbox className="w-12 h-12 opacity-20" />
        </div>
        <p className="text-lg font-medium">{t.noResults}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
      <AnimatePresence mode="popLayout">
        {tutorials.map((tutorial, idx) => (
          <TutorialCard 
            key={`${tutorial.id}-${idx}`} 
            tutorial={tutorial} 
            lang={lang} 
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
