import * as React from "react";

/**
 * surfsync brand mark + lockup (DESIGN.md §10).
 *
 * The mark is a redrawn wave-in-circle: a filled disc with a single
 * S-curve wave channel cut through it (mask), matching the identity
 * deck. The wordmark is "surf" Regular + "sync" Black in BD Sans,
 * converted to outlines — it renders identically everywhere and is a
 * logo, never typeset text (T8).
 *
 * Render in the brand colours only (currentColor). Never rotate,
 * outline, shadow, glass or animate.
 */

export function LogoMark({
  size = 24,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const id = React.useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <mask id={`ss-wave-${id}`}>
        <rect width="48" height="48" fill="white" />
        <path
          d="M7 28.5 C 13.5 20.5, 20.5 32, 28 26.5 S 37 21.5, 41.5 24"
          stroke="black"
          strokeWidth="4.6"
          strokeLinecap="round"
          fill="none"
        />
      </mask>
      <circle cx="24" cy="24" r="21" fill="currentColor" mask={`url(#ss-wave-${id})`} />
    </svg>
  );
}

const WORDMARK_WIDTH = 11603;
const WORDMARK_HEIGHT = 2458; // ascender 2130 + descender 328

/** The wordmark alone, as BD Sans outlines (surf Regular · sync Black). */
export function LogoWordmark({
  height = 20,
  className,
}: {
  height?: number;
  className?: string;
}) {
  return (
    <svg
      width={(height * WORDMARK_WIDTH) / WORDMARK_HEIGHT}
      height={height}
      viewBox={`0 0 ${WORDMARK_WIDTH} ${WORDMARK_HEIGHT}`}
      fill="currentColor"
      aria-label="surfsync"
      role="img"
      className={className}
    >
      <g>
      <path transform="translate(0 2130) scale(1 -1)" d="M1286 678H1180V739Q1180 948 733 948Q496 948 374.0 904.5Q252 861 252 778V750Q252 698 288.5 666.0Q325 634 422.5 610.0Q520 586 705 565Q1035 532 1155.5 474.5Q1276 417 1276 276V242Q1276 114 1126.5 47.0Q977 -20 696 -20Q418 -20 280.5 60.0Q143 140 143 305V377H250V305Q250 185 357.5 130.5Q465 76 696 76Q1169 76 1169 252V281Q1169 340 1131.0 373.5Q1093 407 993.0 430.0Q893 453 694 473Q383 506 264.0 564.0Q145 622 145 754V788Q145 915 294.5 979.5Q444 1044 733 1044Q1286 1044 1286 739Z" />
      <path transform="translate(1429 2130) scale(1 -1)" d="M1329 1024H1432V0H1329V281Q1187 -9 782 -18Q503 -24 354.0 105.0Q205 234 205 469V1024H311V487Q311 276 430.0 177.0Q549 78 782 78Q1041 78 1185.0 225.0Q1329 372 1329 612Z" />
      <path transform="translate(3079 2130) scale(1 -1)" d="M883 1044Q991 1047 1063 1036L1057 940Q992 946 907 946Q763 946 650.5 906.5Q538 867 466.5 795.5Q395 724 358.5 627.0Q322 530 322 412V0H219V1024H322V737Q392 879 533.5 958.5Q675 1038 883 1044Z" />
      <path transform="translate(4182 2130) scale(1 -1)" d="M604 1278Q464 1278 404.5 1218.5Q345 1159 340 1024H731V930H340V0H238V930H-6V1024H238Q240 1099 258.0 1157.5Q276 1216 315.5 1266.5Q355 1317 428.0 1344.5Q501 1372 604 1372Q743 1372 844 1335L819 1251Q713 1278 604 1278Z" />
      <path transform="translate(5069 2130) scale(1 -1)" d="M1389 674H1180V715Q1180 786 1081.5 831.5Q983 877 784 877Q354 877 354 760V754Q354 729 365.0 713.5Q376 698 415.0 679.5Q454 661 539.0 644.5Q624 628 762 612Q834 603 884.5 596.0Q935 589 993.5 579.5Q1052 570 1092.0 560.0Q1132 550 1175.5 536.0Q1219 522 1247.0 506.5Q1275 491 1302.0 470.5Q1329 450 1344.0 426.0Q1359 402 1368.5 371.5Q1378 341 1378 305Q1377 140 1213.0 60.0Q1049 -20 748 -20Q456 -20 299.5 69.0Q143 158 143 334V379H352V334Q352 152 748 152Q1169 152 1169 276V287Q1169 309 1157.0 324.0Q1145 339 1104.0 356.5Q1063 374 973.5 390.0Q884 406 741 422Q619 436 535.5 451.0Q452 466 373.5 490.5Q295 515 248.5 548.5Q202 582 174.0 632.0Q146 682 145 748Q148 897 313.0 970.5Q478 1044 784 1044Q1076 1044 1232.5 960.5Q1389 877 1389 715ZM145 743V754V748ZM1378 307V303V305Z" />
      <path transform="translate(6600 2130) scale(1 -1)" d="M1171 1024H1407L795 -94Q714 -241 625.5 -294.5Q537 -348 403 -348Q259 -348 176 -309L242 -125Q308 -156 403 -156Q519 -156 573 -57L604 0L35 1024H270L719 207Z" />
      <path transform="translate(8041 2130) scale(1 -1)" d="M1030 1042Q1179 1042 1295.5 1012.5Q1412 983 1497.5 921.5Q1583 860 1628.0 760.0Q1673 660 1673 526V0H1464V483Q1464 678 1346.0 769.0Q1228 860 1026 860Q899 860 784.5 814.0Q670 768 592.5 695.5Q515 623 469.5 534.5Q424 446 424 360V0H219V1024H424V754Q523 890 684.0 966.0Q845 1042 1030 1042Z" />
      <path transform="translate(9910 2130) scale(1 -1)" d="M1548 399Q1528 196 1346.0 88.0Q1164 -20 848 -20Q505 -20 324.0 104.0Q143 228 143 473V549Q143 792 324.5 917.0Q506 1042 848 1042Q1479 1042 1544 664H1335Q1305 773 1188.5 816.5Q1072 860 848 860Q595 860 473.5 788.0Q352 716 352 549V473Q352 305 471.5 234.5Q591 164 848 164Q1072 164 1195.5 219.5Q1319 275 1339 399Z" />
      </g>
    </svg>
  );
}

/** Horizontal lockup: mark + wordmark, clear space built in. */
export function LogoLockup({
  height = 24,
  className,
}: {
  height?: number;
  className?: string;
}) {
  const mark = height * 0.82;
  const gap = height * 0.28;
  const wordmarkHeight = height * 0.62;
  return (
    <span className={`inline-flex items-center ${className ?? ""}`} style={{ gap }}>
      <LogoMark size={mark} />
      <LogoWordmark height={wordmarkHeight} />
    </span>
  );
}
