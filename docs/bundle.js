
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

    /* src\DateSwitcher.svelte generated by Svelte v3.12.1 */

    const file = "src\\DateSwitcher.svelte";

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
    			add_location(li, file, 140, 5, 3336);
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
    			add_location(ul, file, 138, 2, 3246);
    			attr_dev(div, "class", "touch-date-wrapper svelte-9pbjus");
    			add_location(div, file, 137, 0, 3155);

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
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<DateSwitcher> was created with unknown prop '${key}'`);
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

    class DateSwitcher extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["selected", "data", "type"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "DateSwitcher", options, id: create_fragment.name });

    		const { ctx } = this.$$;
    		const props = options.props || {};
    		if (ctx.selected === undefined && !('selected' in props)) {
    			console.warn("<DateSwitcher> was created without expected prop 'selected'");
    		}
    		if (ctx.type === undefined && !('type' in props)) {
    			console.warn("<DateSwitcher> was created without expected prop 'type'");
    		}
    	}

    	get selected() {
    		throw new Error("<DateSwitcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set selected(value) {
    		throw new Error("<DateSwitcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get data() {
    		throw new Error("<DateSwitcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set data(value) {
    		throw new Error("<DateSwitcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get type() {
    		throw new Error("<DateSwitcher>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set type(value) {
    		throw new Error("<DateSwitcher>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\DatePicker.svelte generated by Svelte v3.12.1 */

    const file$1 = "src\\DatePicker.svelte";

    // (118:0) {#if visible}
    function create_if_block(ctx) {
    	var div3, div2, div1, t0, t1, div0, button0, t3, button1, current, dispose;

    	var if_block0 = (ctx.mode == 'date') && create_if_block_2(ctx);

    	var if_block1 = (ctx.mode == 'time') && create_if_block_1(ctx);

    	const block = {
    		c: function create() {
    			div3 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			if (if_block0) if_block0.c();
    			t0 = space();
    			if (if_block1) if_block1.c();
    			t1 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Reset";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Ok";
    			attr_dev(button0, "class", "svelte-1j6rpje");
    			add_location(button0, file$1, 140, 10, 4292);
    			attr_dev(button1, "class", "svelte-1j6rpje");
    			add_location(button1, file$1, 141, 10, 4347);
    			attr_dev(div0, "class", "touch-date-reset svelte-1j6rpje");
    			add_location(div0, file$1, 139, 8, 4250);
    			attr_dev(div1, "class", "touch-date-wrapper svelte-1j6rpje");
    			add_location(div1, file$1, 120, 6, 3060);
    			attr_dev(div2, "class", "svelte-1j6rpje");
    			add_location(div2, file$1, 119, 4, 3047);
    			attr_dev(div3, "class", "touch-date-popup svelte-1j6rpje");
    			add_location(div3, file$1, 118, 2, 3010);

    			dispose = [
    				listen_dev(button0, "click", ctx.resetDate),
    				listen_dev(button1, "click", ctx.click_handler)
    			];
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div3, anchor);
    			append_dev(div3, div2);
    			append_dev(div2, div1);
    			if (if_block0) if_block0.m(div1, null);
    			append_dev(div1, t0);
    			if (if_block1) if_block1.m(div1, null);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t3);
    			append_dev(div0, button1);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (ctx.mode == 'date') {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(div1, t0);
    				}
    			} else if (if_block0) {
    				group_outros();
    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});
    				check_outros();
    			}

    			if (ctx.mode == 'time') {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block_1(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div1, t1);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div3);
    			}

    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block.name, type: "if", source: "(118:0) {#if visible}", ctx });
    	return block;
    }

    // (122:8) {#if mode == 'date'}
    function create_if_block_2(ctx) {
    	var div0, t0_value = ctx.date.getDate() + "", t0, t1, t2_value = ctx.MONTHS[ctx.date.getMonth()] + "", t2, t3, t4_value = ctx.date.getFullYear() + "", t4, t5, p, t6_value = ctx.WEEKDAY[ctx.date.getDay()] + "", t6, t7, div1, t8, t9, current;

    	var dateswitcher0 = new DateSwitcher({
    		props: {
    		type: "day",
    		data: ctx.DAYS,
    		selected: ctx.date.getDate(),
    		"}": true
    	},
    		$$inline: true
    	});
    	dateswitcher0.$on("dateChange", ctx.dateChanged);

    	var dateswitcher1 = new DateSwitcher({
    		props: {
    		type: "month",
    		data: ctx.MONTHS,
    		selected: ctx.date.getMonth() + 1
    	},
    		$$inline: true
    	});
    	dateswitcher1.$on("dateChange", ctx.dateChanged);

    	var dateswitcher2 = new DateSwitcher({
    		props: {
    		type: "year",
    		data: ctx.YEARS,
    		selected: ctx.date.getYear() + 1
    	},
    		$$inline: true
    	});
    	dateswitcher2.$on("dateChange", ctx.dateChanged);

    	const block = {
    		c: function create() {
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
    			dateswitcher0.$$.fragment.c();
    			t8 = space();
    			dateswitcher1.$$.fragment.c();
    			t9 = space();
    			dateswitcher2.$$.fragment.c();
    			attr_dev(div0, "class", "touch-date svelte-1j6rpje");
    			add_location(div0, file$1, 122, 10, 3134);
    			add_location(p, file$1, 123, 10, 3245);
    			attr_dev(div1, "class", "touch-date-picker svelte-1j6rpje");
    			add_location(div1, file$1, 124, 10, 3290);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, p, anchor);
    			append_dev(p, t6);
    			insert_dev(target, t7, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(dateswitcher0, div1, null);
    			append_dev(div1, t8);
    			mount_component(dateswitcher1, div1, null);
    			append_dev(div1, t9);
    			mount_component(dateswitcher2, div1, null);
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

    			var dateswitcher0_changes = {};
    			if (changed.DAYS) dateswitcher0_changes.data = ctx.DAYS;
    			if (changed.date) dateswitcher0_changes.selected = ctx.date.getDate();
    			dateswitcher0.$set(dateswitcher0_changes);

    			var dateswitcher1_changes = {};
    			if (changed.date) dateswitcher1_changes.selected = ctx.date.getMonth() + 1;
    			dateswitcher1.$set(dateswitcher1_changes);

    			var dateswitcher2_changes = {};
    			if (changed.date) dateswitcher2_changes.selected = ctx.date.getYear() + 1;
    			dateswitcher2.$set(dateswitcher2_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(dateswitcher0.$$.fragment, local);

    			transition_in(dateswitcher1.$$.fragment, local);

    			transition_in(dateswitcher2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(dateswitcher0.$$.fragment, local);
    			transition_out(dateswitcher1.$$.fragment, local);
    			transition_out(dateswitcher2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div0);
    				detach_dev(t5);
    				detach_dev(p);
    				detach_dev(t7);
    				detach_dev(div1);
    			}

    			destroy_component(dateswitcher0);

    			destroy_component(dateswitcher1);

    			destroy_component(dateswitcher2);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_2.name, type: "if", source: "(122:8) {#if mode == 'date'}", ctx });
    	return block;
    }

    // (132:8) {#if mode == 'time'}
    function create_if_block_1(ctx) {
    	var div0, t0_value = ctx.date.getHours() - 12 + "", t0, t1, t2_value = ctx.date.getMinutes() + "", t2, t3, t4_value = ctx.MERIDIEM[ctx.m] + "", t4, t5, div1, t6, t7, current;

    	var dateswitcher0 = new DateSwitcher({
    		props: {
    		type: "hours",
    		data: ctx.HOURS,
    		selected: ctx.date.getHours() - 12,
    		"}": true
    	},
    		$$inline: true
    	});
    	dateswitcher0.$on("dateChange", ctx.dateChanged);

    	var dateswitcher1 = new DateSwitcher({
    		props: {
    		type: "minutes",
    		data: ctx.MINUTES,
    		selected: ctx.date.getMinutes()
    	},
    		$$inline: true
    	});
    	dateswitcher1.$on("dateChange", ctx.dateChanged);

    	var dateswitcher2 = new DateSwitcher({
    		props: {
    		type: "meridiem",
    		data: ctx.MERIDIEM,
    		selected: ctx.m+1
    	},
    		$$inline: true
    	});
    	dateswitcher2.$on("dateChange", ctx.dateChanged);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = text(":");
    			t2 = text(t2_value);
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = space();
    			div1 = element("div");
    			dateswitcher0.$$.fragment.c();
    			t6 = space();
    			dateswitcher1.$$.fragment.c();
    			t7 = space();
    			dateswitcher2.$$.fragment.c();
    			attr_dev(div0, "class", "touch-date svelte-1j6rpje");
    			add_location(div0, file$1, 132, 10, 3733);
    			attr_dev(div1, "class", "touch-date-picker svelte-1j6rpje");
    			add_location(div1, file$1, 133, 10, 3837);
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, t0);
    			append_dev(div0, t1);
    			append_dev(div0, t2);
    			append_dev(div0, t3);
    			append_dev(div0, t4);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, div1, anchor);
    			mount_component(dateswitcher0, div1, null);
    			append_dev(div1, t6);
    			mount_component(dateswitcher1, div1, null);
    			append_dev(div1, t7);
    			mount_component(dateswitcher2, div1, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if ((!current || changed.date) && t0_value !== (t0_value = ctx.date.getHours() - 12 + "")) {
    				set_data_dev(t0, t0_value);
    			}

    			if ((!current || changed.date) && t2_value !== (t2_value = ctx.date.getMinutes() + "")) {
    				set_data_dev(t2, t2_value);
    			}

    			if ((!current || changed.m) && t4_value !== (t4_value = ctx.MERIDIEM[ctx.m] + "")) {
    				set_data_dev(t4, t4_value);
    			}

    			var dateswitcher0_changes = {};
    			if (changed.date) dateswitcher0_changes.selected = ctx.date.getHours() - 12;
    			dateswitcher0.$set(dateswitcher0_changes);

    			var dateswitcher1_changes = {};
    			if (changed.date) dateswitcher1_changes.selected = ctx.date.getMinutes();
    			dateswitcher1.$set(dateswitcher1_changes);

    			var dateswitcher2_changes = {};
    			if (changed.m) dateswitcher2_changes.selected = ctx.m+1;
    			dateswitcher2.$set(dateswitcher2_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(dateswitcher0.$$.fragment, local);

    			transition_in(dateswitcher1.$$.fragment, local);

    			transition_in(dateswitcher2.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(dateswitcher0.$$.fragment, local);
    			transition_out(dateswitcher1.$$.fragment, local);
    			transition_out(dateswitcher2.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div0);
    				detach_dev(t5);
    				detach_dev(div1);
    			}

    			destroy_component(dateswitcher0);

    			destroy_component(dateswitcher1);

    			destroy_component(dateswitcher2);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_if_block_1.name, type: "if", source: "(132:8) {#if mode == 'time'}", ctx });
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

      let { mode = 'time' } = $$props;
      let m = 1;
      const HOURS = new Array(12).fill(1).map((v, i) => v + i);
      const MINUTES = new Array(59).fill(1).map((v, i) => v + i);

      const MERIDIEM = ['AM', 'PM'];

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

        } else if (type === 'hours'){

          newDate.setHours(changedData + 13);
          newDate.setMinutes(date.getMinutes());

        } else if (type === 'minutes'){

          newDate.setHours(date.getHours());
          newDate.setMinutes(changedData + 1);

        } else if (type === 'meridiem'){

          newDate.setHours(date.getHours());
          newDate.setMinutes(date.getMinutes());
          $$invalidate('m', m = changedData);
        }

        $$invalidate('date', date = newDate);
      };

    	const writable_props = ['mode', 'date', 'visible'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<DatePicker> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {$$invalidate('visible', visible = !visible);};

    	$$self.$set = $$props => {
    		if ('mode' in $$props) $$invalidate('mode', mode = $$props.mode);
    		if ('date' in $$props) $$invalidate('date', date = $$props.date);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
    	};

    	$$self.$capture_state = () => {
    		return { mode, m, date, visible, resetDate, dateChanged, DAYS };
    	};

    	$$self.$inject_state = $$props => {
    		if ('mode' in $$props) $$invalidate('mode', mode = $$props.mode);
    		if ('m' in $$props) $$invalidate('m', m = $$props.m);
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
    		mode,
    		m,
    		HOURS,
    		MINUTES,
    		MERIDIEM,
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
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["mode", "date", "visible"]);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "DatePicker", options, id: create_fragment$1.name });
    	}

    	get mode() {
    		throw new Error("<DatePicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set mode(value) {
    		throw new Error("<DatePicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
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

    /* dev\App.svelte generated by Svelte v3.12.1 */

    const file$2 = "dev\\App.svelte";

    function create_fragment$2(ctx) {
    	var div1, div0, p, t0, t1, input, t2, updating_date, updating_visible, current, dispose;

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

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			p = element("p");
    			t0 = text(ctx._date);
    			t1 = space();
    			input = element("input");
    			t2 = space();
    			datepicker.$$.fragment.c();
    			attr_dev(p, "class", "svelte-1hocbqs");
    			add_location(p, file$2, 54, 4, 889);
    			attr_dev(input, "type", "text");
    			input.value = ctx._date;
    			attr_dev(input, "class", "svelte-1hocbqs");
    			add_location(input, file$2, 55, 4, 927);
    			attr_dev(div0, "class", "center svelte-1hocbqs");
    			add_location(div0, file$2, 53, 2, 863);
    			attr_dev(div1, "class", "container svelte-1hocbqs");
    			add_location(div1, file$2, 52, 0, 835);

    			dispose = [
    				listen_dev(p, "click", ctx.toggle),
    				listen_dev(input, "focus", ctx.toggle)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, p);
    			append_dev(p, t0);
    			append_dev(div0, t1);
    			append_dev(div0, input);
    			append_dev(div0, t2);
    			mount_component(datepicker, div0, null);
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
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(datepicker.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(datepicker.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach_dev(div1);
    			}

    			destroy_component(datepicker);

    			run_all(dispose);
    		}
    	};
    	dispatch_dev("SvelteRegisterBlock", { block, id: create_fragment$2.name, type: "component", source: "", ctx });
    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	

      let date = new Date();
      let visible = false;
      let inputDate;

      afterUpdate(() => {
    	  console.log(date);
      });

      function toggle(){
        $$invalidate('visible', visible = !visible);
      }

    	function datepicker_date_binding(value) {
    		date = value;
    		$$invalidate('date', date);
    	}

    	function datepicker_visible_binding(value_1) {
    		visible = value_1;
    		$$invalidate('visible', visible);
    	}

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ('date' in $$props) $$invalidate('date', date = $$props.date);
    		if ('visible' in $$props) $$invalidate('visible', visible = $$props.visible);
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
    		date,
    		visible,
    		toggle,
    		_date,
    		datepicker_date_binding,
    		datepicker_visible_binding
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    		dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "App", options, id: create_fragment$2.name });
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
