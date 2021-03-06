<template>
  <g id="meeple-layer">
    <!--
      MeepleSelectLayer is just virtual layer used from this class
      because selection operates with meeple positions and position change if meeples are stacked
      it's easier handle all at same place
    -->
    <g
      v-for="meeple in barns"
      :key="meeple.id"
      :transform="transformPosition(meeple.position)"
      :class="colorCssClass(meeple.player)"
    >
      <use
        class="meeple"
        x="-160" y="-160"
        width="320" height="320"
        :href="`${MEEPLES_SVG}#barn`"
      />
    </g>

    <g
      v-for="group in meeples"
      :key="group.id"
      :transform="transformPoint(group)"
    >
      <g
        v-for="meeple in group.meeples"
        :key="meeple.id"
        :transform="`translate(${meeple.x} ${meeple.y})`"
        :class="colorCssClass(meeple.player)"
      >
        <FlockDetail
          v-if="meeple.type === 'Shepherd'"
          :meeple="meeple"
          transform="translate(130 -130)"
        />
        <use
          :class="{meeple: true, 'rot-90': meeple.rotate90}"
          x="-160" y="-160"
          width="320" height="320"
          :href="`${MEEPLES_SVG}#${svgMeepleId(meeple)}`"
          @mouseenter="onMouseOver(meeple.selectable)"
          @mouseleave="onMouseLeave()"
          @click="ev => onSelect(ev, meeple.selectable)"
        />
        <g
          v-if="meeple.selectable"
          :class="meepleSelect.css || 'meeple-select'"
        >
          <circle
            cx="0" cy="0" r="270"
            :class="{'color-stroke': true, mouseover: mouseOver === meeple.selectable }"
            :style="{'pointer-events': 'none'}"
            fill="none"
            stroke-width="70"
          />

          <!--
            invisible shape for tracking mouse events
            use only if single meeple is on the spot
          -->
          <circle
            v-if="group.meeples.length === 1"
            cx="0" cy="0" r="305"
            :style="{'pointer-events': 'all', fill: 'none'}"
            @mouseenter="meepleSelect.local && onMouseOver(meeple.selectable)"
            @mouseleave="meepleSelect.local && onMouseLeave(meeple.selectable)"
            @click="ev => meepleSelect.local && onSelect(ev, meeple.selectable)"
          />
        </g>

        <use
          v-if="fairy && fairy.placement.meepleId === meeple.id"
          class="fairy"
          x="-100" y="-240"
          :width="420" :height="420"
          :href="`${NEUTRAL_SVG}#fairy`"
        />
      </g>

      <g
        v-for="n in group.neutral"
        :key="n.type"
        :transform="`translate(${n.x} ${n.y})`"
        :class="n.type"
      >
        <use v-if="n.type === 'count'" :width="420" :height="420" x="-210" y="-210" :href="`${NEUTRAL_SVG}#count`" />
        <use v-if="n.type === 'mage'" :width="420" :height="420" x="-210" y="-210" :href="`${NEUTRAL_SVG}#mage`" />
        <use v-if="n.type === 'witch'" :width="420" :height="420" x="-210" y="-210" :href="`${NEUTRAL_SVG}#witch`" />
      </g>
    </g>

    <!-- and netutral figures -->
    <g v-if="dragon">
      <polyline
        v-if="dragon.visited && dragon.visited.length"
        :points="dragonVisitedPoints"
        fill="none"
        stroke="#7a172d"
        stroke-width="120"
        stroke-opacity="0.7"
      />

      <g
        :transform="transformPosition(dragon.position)"
        class="dragon"
      >
        <use :width="950" :height="475" x="25" y="250" :href="`${NEUTRAL_SVG}#dragon`" />
      </g>
    </g>

    <!--
        even if meepleId is null, fairy still can be placed on feature.
        this happen when meeple is returned and fairy is no longer bound to it
    -->
    <g
      v-if="fairy && !fairy.placement.meepleId"
      :transform="lonelyFairyTransform()"
      class="fairy"
    >
      <use :width="420" :height="420" :href="`${NEUTRAL_SVG}#fairy`" />
    </g>
  </g>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import groupBy from 'lodash/groupBy'
import keyBy from 'lodash/keyBy'
import kebabCase from 'lodash/kebabCase'

import { isSameFeature } from '@/utils/gameUtils'
import Location from '@/models/Location'
import FlockDetail from '@/components/game/layers/FlockDetail'
import LayerMixin from '@/components/game/layers/LayerMixin'

import { FOLLOWER_ORDERING } from '@/constants/ordering'

const MEEPLES_SVG = require('~/assets/meeples.svg')
const NEUTRAL_SVG = require('~/assets/neutral.svg')
const NEUTRAL_FIGURES = ['count', 'mage', 'witch']

export default {
  components: {
    FlockDetail
  },

  mixins: [LayerMixin],

  props: {
    deployedOnBridge: { type: Boolean, default: false }
  },

  data () {
    return {
      MEEPLES_SVG,
      NEUTRAL_SVG,
      mouseOver: null
    }
  },

  computed: {
    ...mapState({
      dragon: state => state.game.neutralFigures.dragon,
      fairy: state => state.game.neutralFigures.fairy,
      count: state => state.game.neutralFigures.count,
      mage: state => state.game.neutralFigures.mage,
      witch: state => state.game.neutralFigures.witch,
      meepleSelect: state => state.board.layers.MeepleSelectLayer
    }),

    ...mapGetters({
      isDeployedOnBridge: 'game/isDeployedOnBridge'
    }),

    barns () {
      if (this.deployedOnBridge) {
        return []
      }
      return this.$store.state.game.deployedMeeples.filter(m => m.type === 'Barn')
    },

    meeples () {
      const getGroupKey = ptr => {
        return `${ptr.position[0]},${ptr.position[1]},${ptr.location}`
      }

      const selectable = this.meepleSelect ? keyBy(this.meepleSelect.options, 'meepleId') : null
      const filtered = this.$store.state.game.deployedMeeples.filter(m => m.type !== 'Barn' && !this.isDeployedOnBridge(m) ^ this.deployedOnBridge)
      const groupped = groupBy(filtered, getGroupKey)
      const neutralInGroup = {}
      const groups = Object.entries(groupped).map(([key, meeples]) => {
        meeples.sort((a, b) => {
          if (this.fairy) {
            if (this.fairy.placement.meepleId === a.id) {
              return 1
            }
            if (this.fairy.placement.meepleId === b.id) {
              return -1
            }
          }
          return FOLLOWER_ORDERING[a.type] - FOLLOWER_ORDERING[b.type]
        })

        let x = 0
        let y = 0
        const deployedOnFarm = Location.parse(meeples[0].location).isFarmLocation()

        const group = {
          key,
          position: meeples[0].position,
          location: meeples[0].location,
          meeples: meeples.map(m => {
            const mapped = {
              ...m,
              x,
              y,
              rotate90: m.location === 'MONASTERY' || (deployedOnFarm && !['Shepherd', 'Pig'].includes(m.type)),
              selectable: selectable && selectable[m.id]
            }
            x += m.type === 'SmallFollower' ? 100 : 140
            y += 20
            return mapped
          }),
          neutral: []
        }

        NEUTRAL_FIGURES.forEach(figure => {
          if (!this[figure]) {
            return
          }
          const { placement } = this[figure]
          if (isSameFeature(placement, meeples[0]) && !(this.isDeployedOnBridge(placement) ^ this.deployedOnBridge)) {
            neutralInGroup[figure] = true
            group.neutral.push({ type: figure, x, y })
            x += 140
            y += 20
          }
        })
        return group
      })

      NEUTRAL_FIGURES.forEach(figure => {
        if (this[figure] && !neutralInGroup[figure]) {
          const { placement } = this[figure]
          if (!this.isDeployedOnBridge(placement) ^ this.deployedOnBridge) {
            groups.push({
              key: getGroupKey(placement),
              ...placement,
              meeples: [],
              neutral: [{ type: figure, x: 0, y: 0 }]
            })
          }
        }
      })

      return groups
    },

    dragonVisitedPoints () {
      const { visited, position } = this.dragon
      if (!visited || !visited.length) {
        return null
      }
      const points = []
      visited.forEach(pos => {
        const x = 500 + pos[0] * 1000
        const y = 500 + pos[1] * 1000
        points.push(`${x},${y}`)
      })
      const last = visited[visited.length - 1]
      let x = 500 + position[0] * 1000
      let y = 500 + position[1] * 1000
      if (position[0] !== last[0]) {
        x -= Math.sign(position[0] - last[0]) * 600
      }
      if (position[1] !== last[1]) {
        y -= Math.sign(position[1] - last[1]) * 300
      }
      points.push(`${x},${y}`)
      return points.join(' ')
    }
  },

  watch: {
    meepleSelect (val) {
      this.mouseOver = null
    }
  },

  methods: {
    svgMeepleId (meeple) {
      return kebabCase(meeple.type)
    },

    // methods related to meeple select

    onMouseOver (opt) {
      if (opt) {
        this.mouseOver = opt
      }
    },

    onMouseLeave () {
      this.mouseOver = null
    },

    onSelect (ev, opt) {
      if (opt && !this.isDragging(ev)) {
        this.$root.$emit('meeple.select', opt)
      }
    },

    lonelyFairyTransform () {
      const { placement } = this.fairy
      if (this.$store.state.game.setup.rules['fairy-placement'] === 'next-follower') {
        const fp = placement.featurePointer
        return this.transformPoint(fp) + ' translate(-240 -240)'
      } else {
        return this.transformPosition(placement) + ' translate(410 200)'
      }
    }
  }
}
</script>

<style lang="sass" scoped>
.fairy
  opacity: 0.9

.dragon
  opacity: 0.9

.fairy-select
  circle.color-stroke
    stroke: $fairy-color
    stroke-opacity: 0.5

    &.mouseover
      stroke-opacity: 1
</style>
