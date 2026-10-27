/**
 * className for <LinkTabs> in the school area: when the labels don't fit
 * (large text sizes, narrow phones) the tab strip scrolls sideways inside
 * itself instead of widening the whole page. The list keeps its full
 * width when it fits (`min-w-max` on the <ul> only lets it grow).
 *
 * Area work-around for the foundation LinkTabs (whitespace-nowrap, no
 * shrink or scroll): reported in foundation_issues. Drop it once
 * LinkTabs handles overflow itself.
 */
export const TABS_SCROLL = "overflow-x-auto overscroll-x-contain *:min-w-max";
