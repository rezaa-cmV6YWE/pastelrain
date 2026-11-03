import { palette } from '#/components/scene-kit/palette'
import { Path } from '#/components/scene-kit/rough'
import { SceneSvg } from '#/components/scene-kit/scene-svg'

export function Land() {
  return (
    <SceneSvg>
      <g fill={palette.grassShade}>
        <Path d="M0 642 C80 636 170 644 260 638 S380 642 420 646 V660 H0 Z" />
        <Path d="M1060 660 C1160 652 1260 658 1360 654 S1520 656 1600 655 V672 H1060 Z" />
      </g>
      <g fill={palette.navy}>
        <Path d="M70 415 L84 432 L80 441 L96 452 L90 463 L108 476 L100 487 L118 502 L108 513 L122 530 L111 541 L125 560 L108 567 L118 584 L97 590 L88 601 L79 601 L80 655 L66 655 L67 601 L52 598 L40 591 L26 588 L36 572 L20 562 L34 548 L24 532 L38 522 L28 506 L44 496 L36 480 L52 470 L46 456 L60 446 L56 432 Z" />
        <Path d="M1150 652 Q1158 640 1178 641 Q1192 644 1194 652 Z" />
        <Path d="M1200 652 Q1212 642 1228 644 Q1240 647 1240 652 Z" />
        <Path d="M140 640 L146 622 L151 636 L156 610 L162 634 L170 616 L174 636 L182 618 L186 638 L194 624 L200 640 Z" />
        <Path d="M1420 660 L1428 636 L1434 654 L1442 622 L1450 652 L1460 630 L1466 654 L1476 620 L1484 652 L1494 634 L1500 656 L1510 626 L1516 654 L1524 640 L1530 660 Z" />
      </g>
    </SceneSvg>
  )
}
