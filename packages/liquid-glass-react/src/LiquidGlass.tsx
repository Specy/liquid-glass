import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { LiquidGlass as CoreLiquidGlass, type GlassStyle } from '@specy/liquid-glass'

export interface LiquidGlassProps {
    /**
     * Custom CSS styles to apply to the glass container
     */
    style?: string
    /**
     * React CSS properties to apply to the wrapper div
     */
    wrapperStyle?: React.CSSProperties
    /**
     * Glass material properties
     */
    glassStyle?: GlassStyle
    /**
     * Children to render inside the glass container
     */
    children?: React.ReactNode
    /**
     * Callback when the liquid glass instance is ready
     */
    onReady?: (instance: CoreLiquidGlass) => void
    /**
     * The target element to capture for the glass background effect.
     * If not provided, document.body will be used.
     */
    targetElement?: HTMLElement


    /**
     * Optional key to force re-rendering of the component
     * Useful for cases where you want to reset the component state
     */
    renderKey?: string | number
}

export interface LiquidGlassRef {
    /**
     * Get the underlying LiquidGlass instance
     */
    getInstance: () => CoreLiquidGlass | null
    /**
     * Update the screenshot of the background
     */
    updateScreenshot: () => Promise<void>
    /**
     * Force update the glass effect
     */
    forceUpdate: () => Promise<void>
    /**
     * Update glass style properties
     */
    updateGlassStyle: (style: Partial<GlassStyle>) => void
    /**
     * Get current glass style properties
     */
    getGlassStyle: () => Required<GlassStyle> | null
    /**
     * Get the glass DOM element
     */
    getElement: () => HTMLElement | null
    /**
     * Get the content container element
     */
    getContent: () => HTMLDivElement | null

    /**
     * Force update the position of the glass effect
     */
    forcePositionUpdate: () => void

    /**
     * Force update the size of the glass effect
     */
    forceSizeUpdate: () => void
}

export const LiquidGlass = forwardRef<LiquidGlassRef, LiquidGlassProps>(
    (
        {
            style = '',
            wrapperStyle,
            glassStyle,
            children,
            onReady,
            targetElement,
            renderKey,
        },
        ref
    ) => {
        const [ready, setReady] = useState(false)
        const liquidGlassRef = useRef<CoreLiquidGlass | null>(null)
        const contentElementRef = useRef<HTMLDivElement | null>(null)
        const wrapperRef = useRef<HTMLDivElement | null>(null)

        // Store current prop values in refs to avoid recreating the instance
        const styleRef = useRef(style)
        const glassStyleRef = useRef(glassStyle)
        const targetElementRef = useRef(targetElement)

        useImperativeHandle(ref, () => ({
            getInstance: () => liquidGlassRef.current,
            updateScreenshot: async () => {
                if (liquidGlassRef.current) {
                    await liquidGlassRef.current.updateScreenshot()
                }
            },
            forceUpdate: async () => {
                if (liquidGlassRef.current) {
                    await liquidGlassRef.current.forceUpdate()
                }
            },
            updateGlassStyle: (newStyle: Partial<GlassStyle>) => {
                if (liquidGlassRef.current) {
                    liquidGlassRef.current.updateGlassStyle(newStyle)
                }
            },
            getGlassStyle: () => {
                return liquidGlassRef.current ? liquidGlassRef.current.getGlassStyle() : null
            },
            getElement: () => {
                return liquidGlassRef.current ? liquidGlassRef.current.element : null
            }, getContent: () => {
                return liquidGlassRef.current ? liquidGlassRef.current.content : null
            },
            forcePositionUpdate: () => {
                if (liquidGlassRef.current) {
                    liquidGlassRef.current.forcePositionUpdate()
                }
            } ,
            forceSizeUpdate: () => {
                if (liquidGlassRef.current) {
                    liquidGlassRef.current.forceSizeUpdate()
                }
            }
        }))        // Initialize the LiquidGlass instance only once


        useEffect(() => {
            liquidGlassRef.current?.forcePositionUpdate()
        }, [renderKey]) // Recreate instance when renderKey changes

        useEffect(() => {
            if (liquidGlassRef.current) return

            // Use provided target element or fallback to document.body
            const target = targetElementRef.current || document.body

            // Create LiquidGlass instance
            liquidGlassRef.current = new CoreLiquidGlass(
                target,
                styleRef.current,
                glassStyleRef.current
            )

            // Store reference to the content element for React portal
            contentElementRef.current = liquidGlassRef.current.content


            setReady(true)
            // Cleanup function
            return () => {
                if (liquidGlassRef.current) {
                    liquidGlassRef.current.destroy()
                    liquidGlassRef.current = null
                }
                contentElementRef.current = null
            }
        }, []) // Empty dependency array - only run once

        // Update onReady ref when it changes
        useEffect(() => {
            if (!ready || !onReady) return
            onReady(liquidGlassRef.current as CoreLiquidGlass)
        }, [onReady, ready])

        useEffect(() => {
            styleRef.current = style
            if (liquidGlassRef.current) {
                liquidGlassRef.current.setStyle(style)
            }
        }, [style])

        // Update glass style when it changes
        useEffect(() => {
            glassStyleRef.current = glassStyle
            if (liquidGlassRef.current && glassStyle) {
                liquidGlassRef.current.updateGlassStyle(glassStyle)
            }
        }, [glassStyle])        // Render children into the LiquidGlass content element via portal

        useEffect(() => {
            if (!ready || !liquidGlassRef.current) return
            wrapperRef.current?.replaceChildren(liquidGlassRef.current.element)
        }, [ready, liquidGlassRef.current])

        return <>
            {contentElementRef.current && children ?
                createPortal(
                    children,
                    contentElementRef.current
                ) : null}
            <div style={wrapperStyle} ref={wrapperRef}>

            </div>

        </>



    }
)

LiquidGlass.displayName = 'LiquidGlass'
