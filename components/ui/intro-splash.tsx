"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

let introSeenInRuntime = false;

export function IntroSplash() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = introSeenInRuntime || window.sessionStorage.getItem("ajn_intro_seen");

    if (seen) {
      return;
    }

    introSeenInRuntime = true;
    const showTimer = window.setTimeout(() => {
      setShow(true);
    }, 24);

    const hideTimer = window.setTimeout(() => {
      setShow(false);
      window.sessionStorage.setItem("ajn_intro_seen", "1");
    }, 2080);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      {show ? (
        <motion.div
          key="ajn-intro"
          className="fixed inset-0 z-[120] flex items-center justify-center bg-[#040404]/94 backdrop-blur-2xl"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.55, ease: "easeOut" } }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.72, ease: "easeOut" }}
            className="relative text-center"
          >
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[30px] border border-ajn-gold/30 bg-white/[0.04] shadow-[0_0_55px_rgba(212,175,55,0.22)]">
              <span className="font-serif text-4xl font-semibold tracking-[0.22em] text-ajn-gold">AJN</span>
            </div>
            <motion.div
              animate={{
                boxShadow: [
                  "0 0 0 rgba(212,175,55,0)",
                  "0 0 38px rgba(212,175,55,0.16)",
                  "0 0 0 rgba(212,175,55,0)",
                ],
              }}
              transition={{ duration: 2.2, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
              className="mx-auto rounded-full border border-ajn-gold/30 px-6 py-3"
            >
              <p className="text-sm font-semibold tracking-[0.35em] text-ajn-goldSoft">EVENTS GROUP</p>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
