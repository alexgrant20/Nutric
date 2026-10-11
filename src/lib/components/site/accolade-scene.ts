import type * as T from 'three';

type Three = typeof T;

export interface SceneItem {
	id: number;
	image: string;
	year: number | null;
}
export interface SceneOptions {
	colors: { cream: string; forest: string; forestDark: string };
	onStation: (index: number) => void;
	onPick: (id: number) => void;
}

interface Entry {
	item: SceneItem;
	index: number;
	side: number;
	group: T.Group;
	plane: T.Mesh;
	reflection: T.Mesh;
	pedestal: T.Mesh;
	material: T.ShaderMaterial;
	reflectMaterial: T.ShaderMaterial;
	shadow: T.Mesh;
	loaded: number;
	ready: boolean;
}

const GAP = 3.7; // distance between two neighbouring trophies along the gallery
const PEDESTAL = 0.55; // pedestal height
const TURN = 0.36; // how far a neighbouring trophy turns toward the centre

const VERT = /* glsl */ `
	varying vec2 vUv;
	varying float vDepth;
	void main() {
		vUv = uv;
		vec4 mv = modelViewMatrix * vec4(position, 1.0);
		vDepth = -mv.z;
		gl_Position = projectionMatrix * mv;
	}
`;
// A flat render of a real trophy: fades with distance, shows a mirrored copy under the floor, and carries a
// light glint that slides over bright metal as the camera passes.
const FRAG = /* glsl */ `
	uniform sampler2D uMap;
	uniform float uAlpha;
	uniform float uReflect;
	uniform float uSweep;
	uniform float uGlint;
	varying vec2 vUv;
	varying float vDepth;
	void main() {
		vec4 c = texture2D(uMap, vUv);
		float lum = dot(c.rgb, vec3(0.299, 0.587, 0.114));
		float band = exp(-pow((vUv.x - 0.5 - uSweep) * 4.2, 2.0));
		c.rgb += band * uGlint * (0.08 + 0.55 * lum * lum);
		float fade = 1.0 - smoothstep(22.0, 34.0, vDepth);
		float a = c.a * uAlpha * fade;
		if (uReflect > 0.5) a *= 0.32 * pow(1.0 - vUv.y, 1.8);
		if (a < 0.004) discard;
		gl_FragColor = vec4(c.rgb, a);
	}
`;

const clamp = (v: number, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (t: number) => t * t * (3 - 2 * t);

/** A corridor of trophies on pedestals. The camera flies from station to station; the visitor steers it. */
export class AccoladeScene {
	private THREE: Three;
	private scene: T.Scene;
	private camera: T.PerspectiveCamera;
	private renderer: T.WebGLRenderer;
	private raycaster: T.Raycaster;
	private entries: Entry[] = [];
	private textures: T.Texture[] = [];
	private disposables: { dispose(): void }[] = [];
	private pos = 0;
	private target = 0;
	private intro = 0;
	private lastStation = -1;
	private raf = 0;
	private last = 0;
	private visible = false;
	private pointer = { x: 0, y: 0, sx: 0, sy: 0 };
	private drag: { x: number; startX: number; startTarget: number; moved: boolean; id: number } | null = null;
	private wheelAcc = 0;
	private width = 1;
	private height = 1;
	private stopped = false;
	private cleanup: (() => void)[] = [];

	constructor(
		three: Three,
		private canvas: HTMLCanvasElement,
		private items: SceneItem[],
		private opts: SceneOptions
	) {
		this.THREE = three;
		const { WebGLRenderer, Scene, PerspectiveCamera, Color, Fog, Raycaster } = three;
		this.renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
		this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75));
		this.renderer.setClearColor(0x000000, 0);
		this.scene = new Scene();
		this.scene.fog = new Fog(new Color(opts.colors.cream), 16, 40);
		this.camera = new PerspectiveCamera(34, 1, 0.1, 80);
		this.raycaster = new Raycaster();
		this.build();
		this.bind();
		this.last = performance.now();
	}

	private build() {
		const { THREE } = this;
		const { Group, Mesh, PlaneGeometry, CylinderGeometry, MeshStandardMaterial, MeshBasicMaterial, ShaderMaterial, DoubleSide, HemisphereLight, DirectionalLight, Color, TextureLoader } = THREE;

		this.scene.add(new HemisphereLight(0xffffff, new Color(this.opts.colors.cream).multiplyScalar(0.78), 1.35));
		const sun = new DirectionalLight(0xffffff, 1.5);
		sun.position.set(3, 7, 5);
		this.scene.add(sun);

		const planeGeo = new PlaneGeometry(1, 1);
		planeGeo.translate(0, 0.5, 0); // pivot at the bottom edge: a trophy stands on its base
		this.disposables.push(planeGeo);
		const shadowTex = this.radialTexture();
		this.textures.push(shadowTex);
		const pedestalMat = new MeshStandardMaterial({ color: new Color(this.opts.colors.forest), roughness: 0.6, metalness: 0.05 });
		const rimMat = new MeshStandardMaterial({ color: new Color(this.opts.colors.forestDark), roughness: 0.5, metalness: 0.1 });
		this.disposables.push(pedestalMat, rimMat);
		const loader = new TextureLoader();

		this.items.forEach((item, index) => {
			const side = 0;
			const group = new Group();
			group.position.set(index * GAP, 0, 0);

			const mk = (reflect: boolean) =>
				new ShaderMaterial({
					uniforms: { uMap: { value: null }, uAlpha: { value: 0 }, uReflect: { value: reflect ? 1 : 0 }, uSweep: { value: 0 }, uGlint: { value: 0 } },
					vertexShader: VERT,
					fragmentShader: FRAG,
					transparent: true,
					depthWrite: false,
					side: DoubleSide
				});
			const material = mk(false);
			const reflectMaterial = mk(true);
			this.disposables.push(material, reflectMaterial);

			const plane = new Mesh(planeGeo, material);
			plane.visible = false;
			plane.position.y = PEDESTAL;
			plane.userData.id = item.id;
			const reflection = new Mesh(planeGeo, reflectMaterial);
			reflection.visible = false;
			reflection.position.y = -PEDESTAL;

			const pedestal = new Mesh(new CylinderGeometry(0.6, 0.68, PEDESTAL, 48), pedestalMat);
			pedestal.position.y = PEDESTAL / 2;
			const rim = new Mesh(new CylinderGeometry(0.7, 0.7, 0.05, 48), rimMat);
			rim.position.y = PEDESTAL + 0.025;
			this.disposables.push(pedestal.geometry, rim.geometry);

			const shadow = new Mesh(new PlaneGeometry(2.6, 2.6), new MeshBasicMaterial({ map: shadowTex, transparent: true, opacity: 0.42, depthWrite: false }));
			shadow.rotation.x = -Math.PI / 2;
			shadow.position.y = 0.004;
			this.disposables.push(shadow.geometry, shadow.material as T.Material);

			group.add(shadow, pedestal, rim, reflection, plane);
			this.scene.add(group);
			const entry: Entry = { item, index, side, group, plane, reflection, pedestal, material, reflectMaterial, shadow, loaded: 0, ready: false };
			this.entries.push(entry);

			loader.load(
				item.image,
				(tex) => {
					if (this.stopped) { tex.dispose(); return; }
					tex.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
					this.textures.push(tex);
					const img = tex.image as { width: number; height: number };
					const aspect = img.width / img.height;
					let h = 2.6;
					let w = h * aspect;
					if (w > 3.4) { w = 3.4; h = w / aspect; }
					plane.scale.set(w, h, 1);
					reflection.scale.set(w, -h, 1);
					material.uniforms.uMap.value = tex;
					reflectMaterial.uniforms.uMap.value = tex;
					const r = Math.max(0.55, Math.min(0.95, w * 0.3));
					pedestal.scale.set(r / 0.6, 1, r / 0.6);
					rim.scale.set(r / 0.6, 1, r / 0.6);
					shadow.scale.setScalar(r / 0.6);
					plane.visible = true;
					reflection.visible = true;
					entry.ready = true;
				},
				undefined,
				() => { /* a missing image leaves its pedestal empty */ }
			);
		});

		// Year numerals are painted on the floor where each new year begins, like markings on a gallery floor.
		let prev: number | null | undefined;
		this.items.forEach((item, index) => {
			if (item.year == null || item.year === prev) { prev = item.year; return; }
			prev = item.year;
			const tex = this.yearTexture(String(item.year));
			this.textures.push(tex);
			const mat = new MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.16, depthWrite: false });
			const mesh = new Mesh(new PlaneGeometry(4.8, 2.4), mat);
			mesh.rotation.x = -Math.PI / 2;
			mesh.position.set(index * GAP, 0.003, 1.7);
			this.disposables.push(mesh.geometry, mat);
			this.scene.add(mesh);
		});
	}

	private radialTexture() {
		const c = document.createElement('canvas');
		c.width = c.height = 128;
		const g = c.getContext('2d')!;
		const grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
		grad.addColorStop(0, 'rgba(0,0,0,0.9)');
		grad.addColorStop(1, 'rgba(0,0,0,0)');
		g.fillStyle = grad;
		g.fillRect(0, 0, 128, 128);
		return new this.THREE.CanvasTexture(c);
	}
	private yearTexture(text: string) {
		const c = document.createElement('canvas');
		c.width = 1024;
		c.height = 512;
		const g = c.getContext('2d')!;
		g.fillStyle = this.opts.colors.forest;
		g.font = '500 380px Fraunces, Georgia, serif';
		g.textAlign = 'center';
		g.textBaseline = 'middle';
		g.fillText(text, 512, 270);
		const tex = new this.THREE.CanvasTexture(c);
		tex.anisotropy = 4;
		return tex;
	}

	private bind() {
		const el = this.canvas;
		const down = (e: PointerEvent) => {
			el.setPointerCapture(e.pointerId);
			this.drag = { x: e.clientX, startX: e.clientX, startTarget: this.target, moved: false, id: e.pointerId };
		};
		const move = (e: PointerEvent) => {
			const r = el.getBoundingClientRect();
			this.pointer.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
			this.pointer.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
			if (this.drag) {
				const dx = e.clientX - this.drag.startX;
				if (Math.abs(dx) > 6) this.drag.moved = true;
				if (this.drag.moved) this.target = clamp(this.drag.startTarget - dx / (r.width / 3), 0, this.items.length - 1);
			} else {
				el.style.cursor = this.hit(e.clientX, e.clientY) != null ? 'pointer' : 'grab';
			}
		};
		const up = (e: PointerEvent) => {
			const d = this.drag;
			this.drag = null;
			if (!d) return;
			if (d.moved) this.goTo(Math.round(this.target));
			else {
				const id = this.hit(e.clientX, e.clientY);
				if (id != null) this.opts.onPick(id);
			}
		};
		const leave = () => { this.pointer.x = 0; this.pointer.y = 0; };
		const wheel = (e: WheelEvent) => {
			if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return; // vertical wheel keeps scrolling the page
			e.preventDefault();
			this.wheelAcc += e.deltaX;
			if (Math.abs(this.wheelAcc) > 70) { this.step(this.wheelAcc > 0 ? 1 : -1); this.wheelAcc = 0; }
		};
		el.addEventListener('pointerdown', down);
		el.addEventListener('pointermove', move);
		el.addEventListener('pointerup', up);
		el.addEventListener('pointercancel', up);
		el.addEventListener('pointerleave', leave);
		el.addEventListener('wheel', wheel, { passive: false });
		this.cleanup.push(() => {
			el.removeEventListener('pointerdown', down);
			el.removeEventListener('pointermove', move);
			el.removeEventListener('pointerup', up);
			el.removeEventListener('pointercancel', up);
			el.removeEventListener('pointerleave', leave);
			el.removeEventListener('wheel', wheel);
		});
	}

	private hit(clientX: number, clientY: number): number | null {
		const r = this.canvas.getBoundingClientRect();
		const ndc = new this.THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
		this.raycaster.setFromCamera(ndc, this.camera);
		const planes = this.entries.filter((e) => e.ready).map((e) => e.plane);
		const hits = this.raycaster.intersectObjects(planes, false);
		return hits.length ? (hits[0].object.userData.id as number) : null;
	}

	goTo(index: number) {
		this.target = clamp(Math.round(index), 0, this.items.length - 1);
	}
	step(delta: number) {
		this.goTo(Math.round(this.target) + delta);
	}
	get station() {
		return Math.round(this.pos);
	}

	resize(w: number, h: number) {
		this.width = Math.max(1, w);
		this.height = Math.max(1, h);
		this.renderer.setSize(this.width, this.height, false);
		this.camera.aspect = this.width / this.height;
		this.camera.fov = this.camera.aspect < 0.8 ? 46 : this.camera.aspect < 1.2 ? 38 : 30;
		this.camera.updateProjectionMatrix();
		this.frame(0);
	}

	setVisible(v: boolean) {
		this.visible = v;
		if (v && !this.raf && !this.stopped) {
			this.last = performance.now();
			this.raf = requestAnimationFrame(this.loop);
		}
	}

	private loop = (now: number) => {
		this.raf = 0;
		if (this.stopped || !this.visible || document.hidden) return;
		const dt = Math.min(0.05, (now - this.last) / 1000);
		this.last = now;
		this.frame(dt);
		this.raf = requestAnimationFrame(this.loop);
	};

	private frame(dt: number) {
		const n = this.items.length;
		if (!n) return;
		this.intro = Math.min(1, this.intro + dt / 1.2);
		const introE = 1 - Math.pow(1 - this.intro, 3);
		this.pos += (this.target - this.pos) * (1 - Math.exp(-dt * 4.2));
		this.pointer.sx += (this.pointer.x - this.pointer.sx) * (1 - Math.exp(-dt * 4));
		this.pointer.sy += (this.pointer.y - this.pointer.sy) * (1 - Math.exp(-dt * 4));

		const f = clamp(this.pos, 0, n - 1);
		// The camera keeps its distance and only slides sideways along the gallery; the pointer adds a little parallax.
		const slideIn = (1 - introE) * GAP * 0.9;
		const camX = f * GAP + this.pointer.sx * 0.55 + slideIn;
		this.camera.position.set(camX, 1.6 - this.pointer.sy * 0.14, 9);
		this.camera.lookAt(f * GAP + slideIn + this.pointer.sx * 0.35, 1.5, 0);

		for (const e of this.entries) {
			const d = e.index - this.pos;
			const ad = Math.abs(d);
			const ease = smooth(clamp(1 - ad, 0, 1));
			if (e.ready) e.loaded = Math.min(1, e.loaded + dt * 1.8);
			// Neighbours turn toward the centre and sit a little further back, so the row curves around the visitor.
			const far = smooth(clamp((ad - 1.7) / 1.6, 0, 1));
			const alpha = e.loaded * introE * (1 - far);
			e.group.position.x = e.index * GAP + Math.max(-1, Math.min(1, d)) * 0.28 * (1 - ease);
			e.group.position.z = -Math.min(2.2, ad) * 0.95;
			e.group.rotation.y = -Math.max(-2, Math.min(2, d)) * TURN;
			e.group.scale.setScalar(1 + 0.08 * ease);
			const sweep = clamp((this.camera.position.x - e.group.position.x) * 0.14, -0.5, 0.5);
			for (const m of [e.material, e.reflectMaterial]) {
				m.uniforms.uAlpha.value = alpha;
				m.uniforms.uGlint.value = ease * 0.9;
				m.uniforms.uSweep.value = sweep;
			}
		}
		const st = Math.round(f);
		if (st !== this.lastStation) {
			this.lastStation = st;
			this.opts.onStation(st);
		}
		this.renderer.render(this.scene, this.camera);
	}

	dispose() {
		this.stopped = true;
		cancelAnimationFrame(this.raf);
		this.cleanup.forEach((fn) => fn());
		this.scene.traverse((o) => {
			const m = o as T.Mesh;
			if (m.geometry) m.geometry.dispose();
		});
		this.disposables.forEach((d) => d.dispose());
		this.textures.forEach((t) => t.dispose());
		this.renderer.dispose();
		this.renderer.forceContextLoss();
	}
}
