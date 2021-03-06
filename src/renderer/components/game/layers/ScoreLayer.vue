<template>
  <g id="score-layer">
    <g
      v-for="(scores, key) in scoreSources"
      :key="key"
      :transform="transformPointer(scores[0].ptr)"
    >
      <g
        v-for="(s, idx) in scores"
        :key="idx"
        class="points"
        :class="colorCssClass(s.player)"
        :transform="transformStack(idx, scores.length)"
      >
        <rect
          x="-180" y="-120" width="360" height="240"
          rx="120" ry="120"
          @mouseenter="onMouseEnter(s)"
          @mouseleave="onMouseLeave()"
        />
        <text
          :x="s.points < 10 ? -55 : (s.points < 100 ? -110 : -132)"
          :y="s.points < 100 ? 60 : 48"
          :style="{ 'font-size': s.points < 100 ? '192px' : '154px', 'font-weight': 500, 'pointer-events': 'none' }"
        >
          {{ s.points }}
        </text>
      </g>
    </g>
  </g>
</template>

<script>
import { mapState } from 'vuex'
import groupBy from 'lodash/groupBy'

import LayerMixin from '@/components/game/layers/LayerMixin'

export default {
  mixins: [LayerMixin],

  computed: {
    ...mapState({
      gameEnd: state => state.game.phase === 'GameOverPhase',
      history: state => state.game.history,
      playersCount: state => state.game.players.length
    }),

    scoreSources () {
      const items = []
      const len = this.history.length
      let visibleTurns = this.playersCount
      if (this.gameEnd) {
        visibleTurns += 1
      }
      for (let i = Math.max(0, len - visibleTurns); i < len; i++) {
        const h = this.history[i]
        h.events.forEach(ev => {
          if (ev.type === 'points') {
            ev.points.forEach(p => {
              if (p.ptr) {
                items.push(p)
              }
            })
          }
        })
      }
      return groupBy(items, item => this.pointerAsKey(item.ptr))
    }
  },

  methods: {
    transformPointer (ptr) {
      if (Array.isArray(ptr)) {
        return this.transformPosition(ptr) + 'translate(500 500)'
      }
      return this.transformPoint(ptr)
    },

    transformStack (idx, size) {
      const x = 180 + idx * 360 - size * 180
      return `translate(${x} 0)`
    },

    onMouseEnter (points) {
      this.$store.commit('board/pointsExpression', points)
    },

    onMouseLeave () {
      this.$store.commit('board/pointsExpression', null)
    }
  }
}
</script>

<style lang="sass" scoped>
</style>
