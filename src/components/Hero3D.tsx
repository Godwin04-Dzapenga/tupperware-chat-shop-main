import { useEffect, useRef } from "react";
import * as THREE from "three";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Droplets, Package2, ThermometerSun } from "lucide-react";

export const Hero = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // ── Renderer ──────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.set(0, 0, 5);

    // ── Lights ────────────────────────────────────────────────────────────
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambient);

    const tealLight = new THREE.PointLight(0x2dd4bf, 3, 20);
    tealLight.position.set(-3, 2, 3);
    scene.add(tealLight);

    const amberLight = new THREE.PointLight(0xfbbf24, 2, 15);
    amberLight.position.set(3, -1, 2);
    scene.add(amberLight);

    const rimLight = new THREE.DirectionalLight(0x67e8f9, 0.8);
    rimLight.position.set(0, 5, -3);
    scene.add(rimLight);

    // ── Floating product orbs ─────────────────────────────────────────────
    const orbs: { mesh: THREE.Mesh; speed: number; offset: number; rx: number; ry: number }[] = [];

    const orbData = [
      { x: 2.2,  y: 0.6,  z: -0.5, r: 0.55, color: 0x2dd4bf, roughness: 0.1, metalness: 0.8 },
      { x: -2.4, y: -0.3, z: -1.0, r: 0.40, color: 0x0d9488, roughness: 0.2, metalness: 0.6 },
      { x: 1.8,  y: -1.2, z: -0.8, r: 0.32, color: 0xfbbf24, roughness: 0.05, metalness: 0.9 },
      { x: -1.5, y: 1.4,  z: -1.5, r: 0.28, color: 0x67e8f9, roughness: 0.15, metalness: 0.7 },
      { x: 3.0,  y: -0.8, z: -2.0, r: 0.22, color: 0xf97316, roughness: 0.3,  metalness: 0.5 },
      { x: -3.2, y: 0.9,  z: -2.5, r: 0.18, color: 0x2dd4bf, roughness: 0.1,  metalness: 0.9 },
    ];

    orbData.forEach((d, i) => {
      const geo = new THREE.SphereGeometry(d.r, 64, 64);
      const mat = new THREE.MeshStandardMaterial({ color: d.color, roughness: d.roughness, metalness: d.metalness, envMapIntensity: 1.5 });
      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.set(d.x, d.y, d.z);
      scene.add(mesh);
      orbs.push({ mesh, speed: 0.3 + i * 0.07, offset: i * 1.2, rx: (Math.random() - 0.5) * 0.5, ry: (Math.random() - 0.5) * 0.5 });
    });

    // ── Particle field ────────────────────────────────────────────────────
    const particleCount = 180;
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3]     = (Math.random() - 0.5) * 14;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 8 - 3;
    }
    const particleGeo = new THREE.BufferGeometry();
    particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({ color: 0x2dd4bf, size: 0.035, transparent: true, opacity: 0.55, sizeAttenuation: true });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // ── Wireframe ring ────────────────────────────────────────────────────
    const ringGeo = new THREE.TorusGeometry(1.8, 0.012, 16, 120);
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x2dd4bf, transparent: true, opacity: 0.18 });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 2.5;
    ring.position.set(2.0, 0.3, -1.5);
    scene.add(ring);

    const ring2Geo = new THREE.TorusGeometry(1.2, 0.008, 16, 100);
    const ring2Mat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.12 });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = Math.PI / 3;
    ring2.position.set(-2.2, 0.5, -2.0);
    scene.add(ring2);

    // ── Mouse parallax ────────────────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      mouseY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMouseMove);

    // ── Resize ────────────────────────────────────────────────────────────
    const resize = () => {
      if (!canvas.parentElement) return;
      const w = canvas.parentElement.clientWidth;
      const h = canvas.parentElement.clientHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    // ── Animation loop ────────────────────────────────────────────────────
    let frame: number;
    const clock = new THREE.Clock();

    const animate = () => {
      frame = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Camera parallax
      camera.position.x += (mouseX * 0.4 - camera.position.x) * 0.04;
      camera.position.y += (mouseY * 0.25 - camera.position.y) * 0.04;
      camera.lookAt(scene.position);

      // Orbs float and spin
      orbs.forEach(({ mesh, speed, offset, rx, ry }) => {
        mesh.position.y += Math.sin(t * speed + offset) * 0.003;
        mesh.rotation.x += rx * 0.01;
        mesh.rotation.y += ry * 0.012;
      });

      // Teal light pulse
      tealLight.intensity = 2.5 + Math.sin(t * 1.2) * 0.8;
      amberLight.intensity = 1.8 + Math.cos(t * 0.9) * 0.6;

      // Rings rotate
      ring.rotation.z  += 0.002;
      ring2.rotation.z -= 0.0015;

      // Particles drift
      particles.rotation.y += 0.0004;
      particles.rotation.x += 0.0002;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMouseMove);
      ro.disconnect();
      renderer.dispose();
    };
  }, []);

  const scrollToProducts = () => {
    document.getElementById("products")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={containerRef}
      className="relative mb-8 overflow-hidden rounded-[1.5rem] border border-white/10 bg-slate-950 shadow-2xl"
      style={{ minHeight: 420 }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: "url(https://images.unsplash.com/photo-1584308972272-9e4e7685e80f?w=1400&fit=crop&q=80)" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/98 via-slate-900/85 to-slate-950/60" />
      </div>

      {/* Three.js canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 1 }}
      />

      {/* Content */}
      <div className="relative z-10 flex min-h-[420px] flex-col justify-between p-6 md:p-10 lg:p-12">
        <div className="max-w-xl text-left">
          <div className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-teal-400/20 bg-teal-400/10 px-3 py-1 text-xs font-semibold text-teal-300 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-amber-300 animate-pulse" />
            Premium Drinkware &amp; Kitchenware — Harare, Zimbabwe
          </div>

          <h1
            className="mb-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl"
            style={{ textShadow: "0 0 40px hsl(180 65% 45% / 0.4)" }}
          >
            Organize every pour.{" "}
            <span className="bg-gradient-to-r from-teal-300 via-cyan-200 to-amber-200 bg-clip-text text-transparent">
              Elevate every kitchen ritual.
            </span>
          </h1>

          <p className="mb-6 max-w-md text-sm leading-relaxed text-white/65 md:text-base">
            Genuine Tupperware — BPA-free containers, insulated bottles, and pantry systems built to last a lifetime.
          </p>

          <div className="mb-7 flex flex-wrap gap-2">
            {["100% BPA-Free", "24hr Cold / 12hr Hot", "Leakproof Guarantee", "Lifetime Warranty"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80 backdrop-blur-md transition-all hover:border-teal-400/40 hover:bg-teal-400/10 hover:text-teal-300"
              >
                {item}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={scrollToProducts}
              className="rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 px-7 py-5 text-sm font-bold text-white shadow-lg shadow-teal-500/30 transition-all hover:scale-105 hover:shadow-teal-500/50 hover:shadow-xl"
            >
              Shop Collection <ArrowRight className="ml-1.5 h-4 w-4" />
            </Button>
            <Button
              onClick={() => window.open("https://wa.me/2630784721912", "_blank")}
              variant="outline"
              className="rounded-full border-white/20 bg-white/5 px-7 py-5 text-sm font-bold text-white backdrop-blur-md hover:bg-white/10 hover:border-white/30"
            >
              WhatsApp Us
            </Button>
          </div>
        </div>

        {/* Bottom features */}
        <div className="mt-8 grid grid-cols-1 gap-3 border-t border-white/10 pt-6 sm:grid-cols-3">
          {[
            { icon: Droplets, label: "Hydration First", sub: "Clean, insulated, everyday-ready", glow: "teal" },
            { icon: Package2, label: "Pantry Systems", sub: "Stackable storage that keeps it tidy", glow: "cyan" },
            { icon: ThermometerSun, label: "Temperature Control", sub: "Cold stays cold, hot stays hot", glow: "amber" },
          ].map(({ icon: Icon, label, sub, glow }) => (
            <div key={label} className="flex items-center gap-2.5 text-xs text-white/80">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/5 backdrop-blur-md"
                style={{ boxShadow: `0 0 12px hsl(${glow === "teal" ? "180 65% 45%" : glow === "cyan" ? "190 70% 55%" : "38 92% 50%"} / 0.4)` }}
              >
                <Icon className={`h-4 w-4 ${glow === "amber" ? "text-amber-300" : "text-teal-300"}`} />
              </div>
              <div>
                <p className="font-semibold text-white">{label}</p>
                <p className="text-white/50">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
