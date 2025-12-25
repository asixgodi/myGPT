/// <reference types="vite/client" />

declare module '*.vue' {
    import type { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

declare module 'vue-virtual-scroller' {
    import type { Plugin } from 'vue'
    const plugin: Plugin
    export default plugin
    export const DynamicScroller: any
    export const DynamicScrollerItem: any
    export const RecycleScroller: any
}