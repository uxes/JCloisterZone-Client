<template>
  <div class="view game-view">
    <template v-if="phase">
      <Board />
      <aside>
        <TilePackSize :size="tilePackSize" />
        <PlayerPanel
          v-for="(player, idx) in players"
          :key="idx"
          :index="idx"
          :player="player"
        />
      </aside>
      <ActionPanel
        :phase="phase"
        :action="action"
      />
      <PlayEvents />
      <FinalScoringEvents v-if="phase === 'GameOverPhase'" />
      <div
        v-if="gameDialog"
        class="game-modal"
      >
        <div class="game-modal-content">
          <ChooseMonkOrAbbotDialog
            v-if="gameDialog.type === 'monk-or-abbot'"
            v-bind="gameDialog.attrs"
          />
        </div>
      </div>
    </template>
    <template v-else>
      <v-row justify="center" align="center">
        <v-progress-circular indeterminate />
      </v-row>
    </template>
  </div>
</template>

<script>
import { mapState } from 'vuex'

import ActionPanel from '@/components/game/ActionPanel.vue'
import Board from '@/components/game/Board.vue'
import FinalScoringEvents from '@/components/game/FinalScoringEvents.vue'
import ChooseMonkOrAbbotDialog from '@/components/game/dialogs/ChooseMonkOrAbbotDialog.vue'
import PlayerPanel from '@/components/game/PlayerPanel.vue'
import PlayEvents from '@/components/game/PlayEvents.vue'
import TilePackSize from '@/components/game/TilePackSize.vue'

export default {
  components: {
    ActionPanel,
    Board,
    FinalScoringEvents,
    ChooseMonkOrAbbotDialog,
    PlayerPanel,
    PlayEvents,
    TilePackSize
  },

  computed: mapState({
    action: state => state.game.action,
    gameDialog: state => state.gameDialog,
    phase: state => state.game.phase,
    players: state => state.game.players,
    tilePackSize: state => state.game.tilePack.size
  }),

  beforeCreate () {
    if (!this.$store.state.game.setup) {
      this.$store.dispatch('game/close')
      this.$router.push('/')
    }
  },

  mounted () {
    // window.addEventListener('keydown', this.onKeyDown)
  },

  beforeDestroy () {
    // window.removeEventListener('keydown', this.onKeyDown)
    this.$store.dispatch('game/close')
  },

  methods: {
    // async onKeyDown (ev) {
    // }
  }
}
</script>

<style lang="sass" scoped>
.game-view
  position: relative
  display: flex
  overflow: hidden
  height: 100vh

.board
  flex: 1
  background: $bg-color

aside
  box-sizing: border-box
  width: $rside-width
  heigh: 100vh
  position: absolute
  top: 0
  right: 0
  user-select: none

.game-modal
  position: absolute
  top: 0
  left: 0
  width: 100%
  height: 100vh
  background: rgba(255, 255, 255, 0.8)
  z-index: 99
  display: flex
  align-items: center
  justify-content: center

  .game-modal-content
    position: relative
    background: white
    box-shadow: 0px 0px 4px 0px rgba(0,0,0,0.45)
    padding: 40px 60px
</style>