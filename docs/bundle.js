
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function afterUpdate(fn) {
        get_current_component().$$.after_update.push(fn);
    }
    function createEventDispatcher() {
        const component = current_component;
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function bind(component, name, callback) {
        if (component.$$.props.indexOf(name) === -1)
            return;
        component.$$.bound[name] = callback;
        callback(component.$$.ctx[name]);
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, ret, value = ret) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
                return ret;
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, detail));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\Switcher.svelte generated by Svelte v3.12.1 */

    const file = "src\\Switcher.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.item = list[i];
    	return child_ctx;
    }

    // (140:3) {#each data as item }
    function create_each_block(ctx) {
    	var li, t_value = ctx.item + "", t;

    	const block = {
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "svelte-9pbjus");
    			add_location(li, file, 140, 5, 3337);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},

    		p: function update(changed, ctx) {
    			if ((changed.data) && t_value !== (t_value = ctx.item + "")) {
    				set_data_dev(t, t_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(li);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_each_block.name, type: "each", source: "(140:3) {#each data as item }", ctx });
    	return block;
    }

    function create_fragment(ctx) {
    	var div, ul, dispose;

    	let each_value = ctx.data;

    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			ul = element("ul");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr_dev(ul, "class", "touch-date-container svelte-9pbjus");
    			add_location(ul, file, 138, 2, 3247);
    			attr_dev(div, "class", "touch-date-wrapper svelte-9pbjus");
    			add_location(div, file, 137, 0, 3156);

    			dispose = [
    				listen_dev(div, "mousedown", ctx.onMouseDown),
    				listen_dev(div, "touchstart", ctx.onMouseDown)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, ul);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ul, null);
    			}

    			ctx.ul_binding(ul);
    		},

    		p: function update(changed, ctx) {
    			if (changed.data) {
    				each_value = ctx.data;

    				let i;
    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(ul, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		i: noop,
    		o: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div);
    			}

    			destroy_each(each_blocks, detaching);

    			ctx.ul_binding(null);
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	const dispatch = createEventDispatcher();

      let { selected, data = 0, type } = $$props;

      let position = selected ? -(selected - 1) * 50 : 0;
      let offset = 0;
      let dragging = false;

      let itemWrapper, previousY;


      onMount(() => {
       setPosition();
      });

      afterUpdate(() => {
    		let selectedPosition = -(selected - 1) * 50;

        if (!dragging && position !== selectedPosition) {
            position = selectedPosition;
            setPosition();
        }
      });


      function onDateChange(type, changedData) {
    		dispatch('dateChange', {
    			type, changedData
    		});
      }

      function setPosition(){
         let itemPosition = `
      will-change: 'transform';
      transition: transform ${Math.abs(offset) / 100 + 0.1}s;
      transform: translateY(${position}px)
    `;
        $$invalidate('itemWrapper', itemWrapper.style.cssText = itemPosition, itemWrapper);
      }

      let onMouseDown = (event) => {
        previousY = event.touches ? event.touches[0].clientY : event.clientY;
        dragging = true;

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        window.addEventListener('touchmove', onMouseMove);
        window.addEventListener('touchend', onMouseUp);
      };

       let onMouseMove = (event) => {
        let clientY = event.touches ? event.touches[0].clientY : event.clientY;
        offset = clientY - previousY;

        let maxPosition = -data.length * 50;
        let _position = position + offset;
        position = Math.max(maxPosition, Math.min(50, _position));
        previousY = event.touches ? event.touches[0].clientY : event.clientY;
        setPosition();
      };

      let onMouseUp = () => {
        let maxPosition = -(data.length - 1) * 50;
        let rounderPosition = Math.round((position + offset * 5) / 50) * 50;
        let finalPosition = Math.max(maxPosition, Math.min(0, rounderPosition));

        dragging = false;
        position = finalPosition;

        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('touchmove', onMouseMove);
        window.removeEventListener('touchend', onMouseUp);

        setPosition();
        onDateChange(type, -finalPosition / 50);
      };

    	const writable_props = ['selected', 'data', 'type'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Switcher> was created with unknown prop '${key}'`);
    	});

    	function ul_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('itemWrapper', itemWrapper = $$value);
    		});
    	}

    	$$self.$set = $$props => {
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    	};

    	$$self.$capture_state = () => {
    		return { selected, data, type, position, offset, dragging, itemWrapper, previousY, onMouseDown, onMouseMove, onMouseUp };
    	};

    	$$self.$inject_state = $$props => {
    		if ('selected' in $$props) $$invalidate('selected', selected = $$props.selected);
    		if ('data' in $$props) $$invalidate('data', data = $$props.data);
    		if ('type' in $$props) $$invalidate('type', type = $$props.type);
    		if ('position' in $$props) position = $$props.position;
    		if ('offset' in $$props) offset = $$props.offset;
    		if ('dragging' in $$props) dragging = $$props.dragging;
    		if ('itemWrapper' in $$props) $$invalidate('itemWrapper', itemWrapper = $$props.itemWrapper);
    		if ('previousY' in $$props) previousY = $$props.previousY;
    		if ('onMouseDown' in $$props) $$invalidate('onMouseDown', onMouseDown = $$props.onMouseDown);
    		if ('onMouseMove' in $$props) onMouseMove = $$props.onMouseMove;
    		if ('onMouseUp' in $$props) onMouseUp = $$props.onMouseUp;
    	};

    	return {
    		selected,
    		data,
    		type,
    		itemWrapper,
    		onMouseDown,
    		ul_binding
    	};
    }

    class Switcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["selected", "data", "type"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "Switcher", options, id: create_fragment.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.selected === undefined && !('selected' in props)) {
    			console.warn("<Switcher> was created without expected prop 'selected'");
    		}
    		if (ctx.type === undefined && !('type' in props)) {
    			console.warn("<Switcher> was created without expected prop 'type'");
    		}
    	}

    	get selected() {
    		throw new Error("<Switcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<Switcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<Switcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<Switcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<Switcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<Switcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\DatePicker.svelte generated by Svelte v3.12.1 */

    const file$1 = "src\\DatePicker.svelte";

    // (102:0) {#if visible}
    function create_if_block(ctx) {
    	var div5, div4, div3, div0, t0_value = ctx.date.getDate() + "", t0, t1, t2_value = ctx.MONTHS[ctx.date.getMonth()] + "", t2, t3, t4_value = ctx.date.getFullYear() + "", t4, t5, p, t6_value = ctx.WEEKDAY[ctx.date.getDay()] + "", t6, t7, div1, t8, t9, t10, div2, button0, t12, button1, current, dispose;

    	var switcher0 = new Switcher({
    		props: {
    		type: "day",
    		data: ctx.DAYS,
    		selected: ctx.date.getDate(),
    		"}": true
    	},
    		$$inline: true
    	});
    	switcher0.$on("dateChange", ctx.dateChanged);

    	var switcher1 = new Switcher({
    		props: {
    		type: "month",
    		data: ctx.MONTHS,
    		selected: ctx.date.getMonth() + 1
    	},
    		$$inline: true
    	});
    	switcher1.$on("dateChange", ctx.dateChanged);

    	var switcher2 = new Switcher({
    		props: {
    		type: "year",
    		data: ctx.YEARS,
    		selected: ctx.date.getYear() + 1
    	},
    		$$inline: true
    	});
    	switcher2.$on("dateChange", ctx.dateChanged);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = space();
    			p = element("p");
    			t6 = text(t6_value);
    			t7 = space();
    			div1 = element("div");
    			switcher0.$$.fragment.c();
    			t8 = space();
    			switcher1.$$.fragment.c();
    			t9 = space();
    			switcher2.$$.fragment.c();
    			t10 = space();
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "Reset";
    			t12 = space();
    			button1 = element("button");
    			button1.textContent = "Ok";
    			attr_dev(div0, "class", "date-line svelte-l91fd0");
    			add_location(div0, file$1, 105, 8, 2568);
    			attr_dev(p, "class", "day-line svelte-l91fd0");
    			add_location(p, file$1, 106, 8, 2676);
    			attr_dev(div1, "class", "touch-date-picker svelte-l91fd0");
    			add_location(div1, file$1, 107, 8, 2736);
    			attr_dev(button0, "class", "svelte-l91fd0");
    			add_location(button0, file$1, 113, 10, 3152);
    			attr_dev(button1, "class", "svelte-l91fd0");
    			add_location(button1, file$1, 114, 10, 3207);
    			attr_dev(div2, "class", "touch-date-reset svelte-l91fd0");
    			add_location(div2, file$1, 112, 8, 3110);
    			attr_dev(div3, "class", "touch-date-wrapper svelte-l91fd0");
    			add_location(div3, file$1, 104, 6, 2526);
    			attr_dev(div4, "class", "svelte-l91fd0");
    			add_location(div4, file$1, 103, 4, 2513);
    			attr_dev(div5, "class", "touch-date-popup svelte-l91fd0");
    			add_location(div5, file$1, 102, 2, 2476);

    			dispose = [
    				listen_dev(button0, "click", ctx.resetDate),
    				listen_dev(button1, "click", ctx.click_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, t4);
    			append_dev(div3, t5);
    			append_dev(div3, p);
    			append_dev(p, t6);
    			append_dev(div3, t7);
    			append_dev(div3, div1);
    			mount_component(switcher0, div1, null);
    			append_dev(div1, t8);
    			mount_component(switcher1, div1, null);
    			append_dev(div1, t9);
    			mount_component(switcher2, div1, null);
    			append_dev(div3, t10);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(div2, t12);
    			append_dev(div2, button1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.date) && t0_value !== (t0_value = ctx.date.getDate() + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if ((!current || changed.date) && t2_value !== (t2_value = ctx.MONTHS[ctx.date.getMonth()] + "")) {
    				set_data_dev(t2, t2_value);
    			}

    			if ((!current || changed.date) && t4_value !== (t4_value = ctx.date.getFullYear() + "")) {
    				set_data_dev(t4, t4_value);
    			}

    			if ((!current || changed.date) && t6_value !== (t6_value = ctx.WEEKDAY[ctx.date.getDay()] + "")) {
    				set_data_dev(t6, t6_value);
    			}

    			var switcher0_changes = {};
    			if (changed.DAYS) switcher0_changes.data = ctx.DAYS;
    			if (changed.date) switcher0_changes.selected = ctx.date.getDate();
    			switcher0.$set(switcher0_changes);

    			var switcher1_changes = {};
    			if (changed.date) switcher1_changes.selected = ctx.date.getMonth() + 1;
    			switcher1.$set(switcher1_changes);

    			var switcher2_changes = {};
    			if (changed.date) switcher2_changes.selected = ctx.date.getYear() + 1;
    			switcher2.$set(switcher2_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(switcher0.$$.fragment, local);

    			transition_in(switcher1.$$.fragment, local);

    			transition_in(switcher2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(switcher0.$$.fragment, local);
    			transition_out(switcher1.$$.fragment, local);
    			transition_out(switcher2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div5);
    			}

    			destroy_component(switcher0);

    			destroy_component(switcher1);

    			destroy_component(switcher2);

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(102:0) {#if visible}", ctx });
    	return block;
    }

    function create_fragment$1(ctx) {
    	var if_block_anchor, current;

    	var if_block = (ctx.visible) && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.visible) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$1.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'July', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
      const YEARS = new Array(201).fill(1900).map((v, i) => v + i);
      const WEEKDAY = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      let { date = new Date(), visible = false } = $$props;

      let resetDate = (event) => {
        event.stopPropagation();
        $$invalidate('date', date = new Date());
      };

      let dateChanged = (event) => {

        let {type, changedData} = event.detail;
        let newDate = new Date();

        if (type === 'day') {
          newDate = new Date(date.getFullYear(), date.getMonth(), changedData + 1);
        } else if (type === 'month') {
          let maxDayInSelectedMonth = new Date(date.getFullYear(), changedData + 1, 0).getDate();
          let day = Math.min(date.getDate(), maxDayInSelectedMonth);
          newDate = new Date(date.getFullYear(), changedData, day);
        } else if (type === 'year') {
          let maxDayInSelectedMonth = new Date(1900 + changedData, date.getMonth() + 1, 0).getDate();
          let day = Math.min(date.getDate(), maxDayInSelectedMonth);
          newDate = new Date(1900 + changedData, date.getMonth(), day);

        }

        $$invalidate('date', date = newDate);
      };

    	const writable_props = ['date', 'visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<DatePicker> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {$$invalidate('visible', visible = !visible);};

    	$$self.$set = $$props => {
    		if ('date' in $$props) $$invalidate('date', date = $$props.date);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { date, visible, resetDate, dateChanged, DAYS };
    	};

    	$$self.$inject_state = $$props => {
    		if ('date' in $$props) $$invalidate('date', date = $$props.date);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    		if ('resetDate' in $$props) $$invalidate('resetDate', resetDate = $$props.resetDate);
    		if ('dateChanged' in $$props) $$invalidate('dateChanged', dateChanged = $$props.dateChanged);
    		if ('DAYS' in $$props) $$invalidate('DAYS', DAYS = $$props.DAYS);
    	};

    	let DAYS;

    	$$self.$$.update = ($$dirty = { date: 1 }) => {
    		if ($$dirty.date) { $$invalidate('DAYS', DAYS = new Array( new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate() ).fill(1).map((v, i) => v + i)); }
    	};

    	return {
    		MONTHS,
    		YEARS,
    		WEEKDAY,
    		date,
    		visible,
    		resetDate,
    		dateChanged,
    		DAYS,
    		click_handler
    	};
    }

    class DatePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["date", "visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "DatePicker", options, id: create_fragment$1.name });
    	}

    	get date() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set date(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\TimePicker.svelte generated by Svelte v3.12.1 */

    const file$2 = "src\\TimePicker.svelte";

    // (108:0) {#if visible}
    function create_if_block$1(ctx) {
    	var div5, div4, div3, div0, t0, t1, div1, t2, t3, t4, div2, button0, t6, button1, current, dispose;

    	var switcher0 = new Switcher({
    		props: {
    		type: "hours",
    		data: ctx.HOURS,
    		selected: ctx.selectedHour,
    		"}": true
    	},
    		$$inline: true
    	});
    	switcher0.$on("dateChange", ctx.dateChanged);

    	var switcher1 = new Switcher({
    		props: {
    		type: "minutes",
    		data: ctx.MINUTES,
    		selected: ctx.time.getMinutes()
    	},
    		$$inline: true
    	});
    	switcher1.$on("dateChange", ctx.dateChanged);

    	var switcher2 = new Switcher({
    		props: {
    		type: "meridiem",
    		data: ctx.MERIDIEM,
    		selected: ctx.selectedMeridiem
    	},
    		$$inline: true
    	});
    	switcher2.$on("dateChange", ctx.dateChanged);

    	const block = {
    		c: function create() {
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			t0 = text(ctx._time);
    			t1 = space();
    			div1 = element("div");
    			switcher0.$$.fragment.c();
    			t2 = space();
    			switcher1.$$.fragment.c();
    			t3 = space();
    			switcher2.$$.fragment.c();
    			t4 = space();
    			div2 = element("div");
    			button0 = element("button");
    			button0.textContent = "Reset";
    			t6 = space();
    			button1 = element("button");
    			button1.textContent = "Ok";
    			attr_dev(div0, "class", "touch-date svelte-1j6rpje");
    			add_location(div0, file$2, 111, 10, 2472);
    			attr_dev(div1, "class", "touch-date-picker svelte-1j6rpje");
    			add_location(div1, file$2, 112, 10, 2521);
    			attr_dev(button0, "class", "svelte-1j6rpje");
    			add_location(button0, file$2, 118, 10, 2953);
    			attr_dev(button1, "class", "svelte-1j6rpje");
    			add_location(button1, file$2, 119, 10, 3008);
    			attr_dev(div2, "class", "touch-date-reset svelte-1j6rpje");
    			add_location(div2, file$2, 117, 8, 2911);
    			attr_dev(div3, "class", "touch-date-wrapper svelte-1j6rpje");
    			add_location(div3, file$2, 110, 6, 2428);
    			attr_dev(div4, "class", "svelte-1j6rpje");
    			add_location(div4, file$2, 109, 4, 2415);
    			attr_dev(div5, "class", "touch-date-popup svelte-1j6rpje");
    			add_location(div5, file$2, 108, 2, 2378);

    			dispose = [
    				listen_dev(button0, "click", ctx.resetDate),
    				listen_dev(button1, "click", ctx.click_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, t0);
    			append_dev(div3, t1);
    			append_dev(div3, div1);
    			mount_component(switcher0, div1, null);
    			append_dev(div1, t2);
    			mount_component(switcher1, div1, null);
    			append_dev(div1, t3);
    			mount_component(switcher2, div1, null);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, button0);
    			append_dev(div2, t6);
    			append_dev(div2, button1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed._time) {
    				set_data_dev(t0, ctx._time);
    			}

    			var switcher0_changes = {};
    			if (changed.selectedHour) switcher0_changes.selected = ctx.selectedHour;
    			switcher0.$set(switcher0_changes);

    			var switcher1_changes = {};
    			if (changed.time) switcher1_changes.selected = ctx.time.getMinutes();
    			switcher1.$set(switcher1_changes);

    			var switcher2_changes = {};
    			if (changed.selectedMeridiem) switcher2_changes.selected = ctx.selectedMeridiem;
    			switcher2.$set(switcher2_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(switcher0.$$.fragment, local);

    			transition_in(switcher1.$$.fragment, local);

    			transition_in(switcher2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(switcher0.$$.fragment, local);
    			transition_out(switcher1.$$.fragment, local);
    			transition_out(switcher2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div5);
    			}

    			destroy_component(switcher0);

    			destroy_component(switcher1);

    			destroy_component(switcher2);

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block$1.name, type: "if", source: "(108:0) {#if visible}", ctx });
    	return block;
    }

    function create_fragment$2(ctx) {
    	var input, t, if_block_anchor, current, dispose;

    	var if_block = (ctx.visible) && create_if_block$1(ctx);

    	const block = {
    		c: function create() {
    			input = element("input");
    			t = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(input, "type", "text");
    			input.readOnly = true;
    			input.value = ctx._time;
    			add_location(input, file$2, 106, 0, 2279);
    			dispose = listen_dev(input, "focus", ctx.focus_handler);
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			insert_dev(target, t, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed._time) {
    				prop_dev(input, "value", ctx._time);
    			}

    			if (ctx.visible) {
    				if (if_block) {
    					if_block.p(changed, ctx);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();
    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(input);
    				detach_dev(t);
    			}

    			if (if_block) if_block.d(detaching);

    			if (detaching) {
    				detach_dev(if_block_anchor);
    			}

    			dispose();
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	const HOURS = new Array(12).fill(1).map((v, i) => v + i);
      const MINUTES = new Array(59).fill(1).map((v, i) => v + i);
      const MERIDIEM = ['AM', 'PM'];


      let { time = new Date(), _time, selectedHour, selectedMeridiem, visible = false } = $$props;

      let resetDate = (event) => {
        event.stopPropagation();
        $$invalidate('time', time = new Date());
      };

      let dateChanged = (event) => {

        let {type, changedData} = event.detail;
        let newTime = new Date();

        if (type === 'hours'){

          newTime.setHours(changedData + 1);
          newTime.setMinutes(time.getMinutes());

        } else if (type === 'minutes'){

          newTime.setHours(time.getHours());
          newTime.setMinutes(changedData + 1);

        } else if (type === 'meridiem'){

          if(~~changedData){
            newTime.setHours(time.getHours() + 12 );
          }else{
            newTime.setHours(time.getHours() - 12 );
          }
          newTime.setMinutes(time.getMinutes());
        }

        $$invalidate('time', time = newTime);
      };

    	const writable_props = ['time', '_time', 'selectedHour', 'selectedMeridiem', 'visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<TimePicker> was created with unknown prop '${key}'`);
    	});

    	const focus_handler = () => {$$invalidate('visible', visible = !visible);};

    	const click_handler = () => {$$invalidate('visible', visible = !visible);};

    	$$self.$set = $$props => {
    		if ('time' in $$props) $$invalidate('time', time = $$props.time);
    		if ('_time' in $$props) $$invalidate('_time', _time = $$props._time);
    		if ('selectedHour' in $$props) $$invalidate('selectedHour', selectedHour = $$props.selectedHour);
    		if ('selectedMeridiem' in $$props) $$invalidate('selectedMeridiem', selectedMeridiem = $$props.selectedMeridiem);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { time, _time, selectedHour, selectedMeridiem, visible, resetDate, dateChanged };
    	};

    	$$self.$inject_state = $$props => {
    		if ('time' in $$props) $$invalidate('time', time = $$props.time);
    		if ('_time' in $$props) $$invalidate('_time', _time = $$props._time);
    		if ('selectedHour' in $$props) $$invalidate('selectedHour', selectedHour = $$props.selectedHour);
    		if ('selectedMeridiem' in $$props) $$invalidate('selectedMeridiem', selectedMeridiem = $$props.selectedMeridiem);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    		if ('resetDate' in $$props) $$invalidate('resetDate', resetDate = $$props.resetDate);
    		if ('dateChanged' in $$props) $$invalidate('dateChanged', dateChanged = $$props.dateChanged);
    	};

    	$$self.$$.update = ($$dirty = { time: 1 }) => {
    		if ($$dirty.time) { {
            $$invalidate('_time', _time = time.toLocaleTimeString('en-US', {timeStyle: 'short'}));
            $$invalidate('selectedHour', selectedHour = +time.toLocaleTimeString('en-us', {hour12:true, hour:'numeric'}).split(' ')[0]);
            $$invalidate('selectedMeridiem', selectedMeridiem = time.getHours() < 12 ? 1 : 2);
          } }
    	};

    	return {
    		HOURS,
    		MINUTES,
    		MERIDIEM,
    		time,
    		_time,
    		selectedHour,
    		selectedMeridiem,
    		visible,
    		resetDate,
    		dateChanged,
    		focus_handler,
    		click_handler
    	};
    }

    class TimePicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, ["time", "_time", "selectedHour", "selectedMeridiem", "visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "TimePicker", options, id: create_fragment$2.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx._time === undefined && !('_time' in props)) {
    			console.warn("<TimePicker> was created without expected prop '_time'");
    		}
    		if (ctx.selectedHour === undefined && !('selectedHour' in props)) {
    			console.warn("<TimePicker> was created without expected prop 'selectedHour'");
    		}
    		if (ctx.selectedMeridiem === undefined && !('selectedMeridiem' in props)) {
    			console.warn("<TimePicker> was created without expected prop 'selectedMeridiem'");
    		}
    	}

    	get time() {
    		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set time(value) {
    		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get _time() {
    		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set _time(value) {
    		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedHour() {
    		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedHour(value) {
    		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get selectedMeridiem() {
    		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selectedMeridiem(value) {
    		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get visible() {
    		throw new Error("<TimePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set visible(value) {
    		throw new Error("<TimePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* dev\App.svelte generated by Svelte v3.12.1 */

    const file$3 = "dev\\App.svelte";

    function create_fragment$3(ctx) {
    	var div1, div0, p0, t0, t1, input, t2, updating_date, updating_visible, t3, hr, t4, p1, t5, t6, updating_time, current, dispose;

    	function datepicker_date_binding(value) {
    		ctx.datepicker_date_binding.call(null, value);
    		updating_date = true;
    		add_flush_callback(() => updating_date = false);
    	}

    	function datepicker_visible_binding(value_1) {
    		ctx.datepicker_visible_binding.call(null, value_1);
    		updating_visible = true;
    		add_flush_callback(() => updating_visible = false);
    	}

    	let datepicker_props = {};
    	if (ctx.date !== void 0) {
    		datepicker_props.date = ctx.date;
    	}
    	if (ctx.visible !== void 0) {
    		datepicker_props.visible = ctx.visible;
    	}
    	var datepicker = new DatePicker({ props: datepicker_props, $$inline: true });

    	binding_callbacks.push(() => bind(datepicker, 'date', datepicker_date_binding));
    	binding_callbacks.push(() => bind(datepicker, 'visible', datepicker_visible_binding));

    	function timepicker_time_binding(value_2) {
    		ctx.timepicker_time_binding.call(null, value_2);
    		updating_time = true;
    		add_flush_callback(() => updating_time = false);
    	}

    	let timepicker_props = {};
    	if (ctx.time !== void 0) {
    		timepicker_props.time = ctx.time;
    	}
    	var timepicker = new TimePicker({ props: timepicker_props, $$inline: true });

    	binding_callbacks.push(() => bind(timepicker, 'time', timepicker_time_binding));

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			t0 = text(ctx._date);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			datepicker.$$.fragment.c();
    			t3 = space();
    			hr = element("hr");
    			t4 = space();
    			p1 = element("p");
    			t5 = text(ctx.time);
    			t6 = space();
    			timepicker.$$.fragment.c();
    			attr_dev(p0, "class", "svelte-17s18kr");
    			add_location(p0, file$3, 62, 4, 1074);
    			attr_dev(input, "type", "text");
    			input.readOnly = true;
    			input.value = ctx._date;
    			attr_dev(input, "class", "svelte-17s18kr");
    			add_location(input, file$3, 63, 4, 1112);
    			attr_dev(hr, "class", "svelte-17s18kr");
    			add_location(hr, file$3, 66, 4, 1222);
    			attr_dev(p1, "class", "svelte-17s18kr");
    			add_location(p1, file$3, 67, 4, 1232);
    			attr_dev(div0, "class", "center svelte-17s18kr");
    			add_location(div0, file$3, 61, 2, 1048);
    			attr_dev(div1, "class", "container svelte-17s18kr");
    			add_location(div1, file$3, 60, 0, 1020);

    			dispose = [
    				listen_dev(p0, "click", ctx.toggle),
    				listen_dev(input, "focus", ctx.toggle),
    				listen_dev(p1, "click", ctx.toggle)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p0);
    			append_dev(p0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, input);
    			append_dev(div0, t2);
    			mount_component(datepicker, div0, null);
    			append_dev(div0, t3);
    			append_dev(div0, hr);
    			append_dev(div0, t4);
    			append_dev(div0, p1);
    			append_dev(p1, t5);
    			append_dev(div0, t6);
    			mount_component(timepicker, div0, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (!current || changed._date) {
    				set_data_dev(t0, ctx._date);
    				prop_dev(input, "value", ctx._date);
    			}

    			var datepicker_changes = {};
    			if (!updating_date && changed.date) {
    				datepicker_changes.date = ctx.date;
    			}
    			if (!updating_visible && changed.visible) {
    				datepicker_changes.visible = ctx.visible;
    			}
    			datepicker.$set(datepicker_changes);

    			if (!current || changed.time) {
    				set_data_dev(t5, ctx.time);
    			}

    			var timepicker_changes = {};
    			if (!updating_time && changed.time) {
    				timepicker_changes.time = ctx.time;
    			}
    			timepicker.$set(timepicker_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(datepicker.$$.fragment, local);

    			transition_in(timepicker.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(datepicker.$$.fragment, local);
    			transition_out(timepicker.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			destroy_component(datepicker);

    			destroy_component(timepicker);

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$3.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	

      let { mode = 'time' } = $$props;

      let date = new Date();
      let time = new Date();
      let visible = false;
      let visibleTime = false;
      let inputDate;

      afterUpdate(() => {
    	  
      });

      function toggle(){
        $$invalidate('visible', visible = !visible);
      }

    	const writable_props = ['mode'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function datepicker_date_binding(value) {
    		date = value;
    		$$invalidate('date', date);
    	}

    	function datepicker_visible_binding(value_1) {
    		visible = value_1;
    		$$invalidate('visible', visible);
    	}

    	function timepicker_time_binding(value_2) {
    		time = value_2;
    		$$invalidate('time', time);
    	}

    	$$self.$set = $$props => {
    		if ('mode' in $$props) $$invalidate('mode', mode = $$props.mode);
    	};

    	$$self.$capture_state = () => {
    		return { mode, date, time, visible, visibleTime, inputDate, _date, _inputdate };
    	};

    	$$self.$inject_state = $$props => {
    		if ('mode' in $$props) $$invalidate('mode', mode = $$props.mode);
    		if ('date' in $$props) $$invalidate('date', date = $$props.date);
    		if ('time' in $$props) $$invalidate('time', time = $$props.time);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    		if ('visibleTime' in $$props) visibleTime = $$props.visibleTime;
    		if ('inputDate' in $$props) $$invalidate('inputDate', inputDate = $$props.inputDate);
    		if ('_date' in $$props) $$invalidate('_date', _date = $$props._date);
    		if ('_inputdate' in $$props) _inputdate = $$props._inputdate;
    	};

    	let _date, _inputdate;

    	$$self.$$.update = ($$dirty = { date: 1, inputDate: 1 }) => {
    		if ($$dirty.date) { $$invalidate('_date', _date = date.toLocaleDateString("en-US")); }
    		if ($$dirty.inputDate) { _inputdate = new Date(inputDate); }
    	};

    	return {
    		mode,
    		date,
    		time,
    		visible,
    		toggle,
    		_date,
    		datepicker_date_binding,
    		datepicker_visible_binding,
    		timepicker_time_binding
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, ["mode"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$3.name });
    	}

    	get mode() {
    		throw new Error("<App>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mode(value) {
    		throw new Error("<App>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
