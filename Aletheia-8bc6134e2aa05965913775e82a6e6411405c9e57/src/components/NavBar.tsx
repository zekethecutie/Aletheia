
import React from 'react';
import { ViewState } from '../types';
import { IconScroll, IconStar, IconUser, IconSearch, IconMirror, IconHierarchy, IconIdentity, IconEye } from './Icons';

interface NavBarProps {
  current: ViewState;
  setView: (v: ViewState) => void;
}

export const NavBar: React.FC<NavBarProps> = ({ current, setView }) => {
  const navItemClass = (view: ViewState) => 
    `flex flex-col items-center justify-center w-full h-full transition-all duration-300 relative group ${current === view ? 'text-white' : 'text-slate-600 hover:text-slate-400'}`;

  const iconClass = (view: ViewState) =>
    `w-6 h-6 mb-1 transition-transform duration-300 ${current === view ? 'scale-110 drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : ''}`;

  return (
    <div className="fixed bottom-0 left-0 w-full h-20 bg-black/95 backdrop-blur-xl border-t border-slate-900 flex justify-between items-center z-50 pb-4 px-2">
      <button onClick={() => setView(ViewState.SANCTUM)} className={navItemClass(ViewState.SANCTUM)}>
        <IconScroll className={iconClass(ViewState.SANCTUM)} />
        <span className="text-[7px] uppercase font-black tracking-widest">Sanctum</span>
      </button>
      
      <button onClick={() => setView(ViewState.EXPLORE)} className={navItemClass(ViewState.EXPLORE)}>
        <IconSearch className={iconClass(ViewState.EXPLORE)} />
        <span className="text-[7px] uppercase font-black tracking-widest">Explore</span>
      </button>

      <button onClick={() => setView(ViewState.HIERARCHY)} className={navItemClass(ViewState.HIERARCHY)}>
        <IconHierarchy className={iconClass(ViewState.HIERARCHY)} />
        <span className="text-[7px] uppercase font-black tracking-widest">Hierarchy</span>
      </button>

      <button onClick={() => setView(ViewState.MIRROR)} className={navItemClass(ViewState.MIRROR)}>
        <div className={`absolute -top-6 bg-slate-900 border-2 border-slate-800 rounded-full p-3 transition-all ${current === ViewState.MIRROR ? 'border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.5)] -translate-y-2' : ''}`}>
             <IconStar className={`w-6 h-6 ${current === ViewState.MIRROR ? 'text-indigo-400' : 'text-slate-400'}`} />
        </div>
        <div className="h-6"></div>
        <span className={`text-[7px] uppercase font-black tracking-widest mt-1 ${current === ViewState.MIRROR ? 'text-indigo-400' : ''}`}>Mirror</span>
      </button>

      <button onClick={() => setView(ViewState.ORACLE)} className={navItemClass(ViewState.ORACLE)}>
        <IconEye className={iconClass(ViewState.ORACLE)} />
        <span className="text-[7px] uppercase font-black tracking-widest">Consult</span>
      </button>

      <button onClick={() => setView(ViewState.PROFILE)} className={navItemClass(ViewState.PROFILE)}>
        <IconIdentity className={iconClass(ViewState.PROFILE)} />
        <span className="text-[7px] uppercase font-black tracking-widest">Identity</span>
      </button>

      <button onClick={() => setView(ViewState.SYSTEM)} className={navItemClass(ViewState.SYSTEM)}>
        <IconUser className={iconClass(ViewState.SYSTEM)} />
        <span className="text-[7px] uppercase font-black tracking-widest">System</span>
      </button>
    </div>
  );
};
