'use client';
import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">⚡</span>
            <span className="text-xl font-bold text-orange-400">FuelOS</span>
          </div>
          <nav className="flex gap-6 text-sm text-gray-400">
            <Link href="/plan" className="hover:text-white transition-colors">Plan</Link>
            <Link href="/shop" className="hover:text-white transition-colors">Shop</Link>
            <Link href="/race" className="hover:text-white transition-colors">Race Mode</Link>
            <Link href="/learn" className="hover:text-white transition-colors">Learn</Link>
          </nav>
        </div>
      </header>
      
      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6 py-20 text-center">
        <div className="mb-6">
          <span className="bg-orange-500/20 text-orange-400 text-sm px-3 py-1 rounded-full border border-orange-500/30">
            Multi-marques · Multi-sports · Race Day Ready
          </span>
        </div>
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          Votre nutrition endurance<br />
          <span className="text-orange-400">pilotée par la data</span>
        </h1>
        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto">
          Planifiez, achetez et exécutez votre stratégie nutritionnelle.
          Timer intelligent, alertes push, recalcul dynamique le jour J.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link href="/plan" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg">
            Créer mon plan →
          </Link>
          <Link href="/race" className="border border-gray-700 hover:border-gray-500 text-white font-semibold px-8 py-4 rounded-xl transition-colors text-lg">
            Race Mode ⚡
          </Link>
        </div>
        
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
          <FeatureCard
            icon="🎯"
            title="PLAN"
            desc="CHO/h, hydratation, sodium calculés selon votre profil, la météo et le dénivelé"
            href="/plan"
            color="blue"
          />
          <FeatureCard
            icon="🛒"
            title="SHOP"
            desc="500+ produits (Maurten, SiS, Tailwind, Näak…). Liste de courses auto-générée"
            href="/shop"
            color="green"
          />
          <FeatureCard
            icon="⚡"
            title="RACE MODE"
            desc="Timer intelligent + notifications push. Recalcul dynamique si vous déviez du plan"
            href="/race"
            color="orange"
            badge="#1 différenciateur"
          />
          <FeatureCard
            icon="📊"
            title="LEARN"
            desc="Débrief post-course, suivi GI, apprentissage entre les événements"
            href="/learn"
            color="purple"
          />
        </div>
      </main>
      
      {/* Stats */}
      <section className="border-t border-gray-800 py-16">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-3 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-orange-400">500+</div>
            <div className="text-gray-400 mt-1">Produits catalogués</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-orange-400">4</div>
            <div className="text-gray-400 mt-1">Sports couverts</div>
          </div>
          <div>
            <div className="text-4xl font-bold text-orange-400">∞</div>
            <div className="text-gray-400 mt-1">Combinaisons de plans</div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, desc, href, color, badge }: {
  icon: string;
  title: string;
  desc: string;
  href: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
  badge?: string;
}) {
  const colors = {
    blue: 'border-blue-500/30 hover:border-blue-500/60 bg-blue-500/5',
    green: 'border-green-500/30 hover:border-green-500/60 bg-green-500/5',
    orange: 'border-orange-500/30 hover:border-orange-500/60 bg-orange-500/5',
    purple: 'border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5',
  };
  return (
    <Link href={href} className={`border rounded-xl p-6 transition-all cursor-pointer ${colors[color]}`}>
      {badge && (
        <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full mb-3 inline-block">
          {badge}
        </span>
      )}
      <div className="text-3xl mb-3">{icon}</div>
      <h3 className="font-bold text-lg mb-2">{title}</h3>
      <p className="text-gray-400 text-sm leading-relaxed">{desc}</p>
    </Link>
  );
}