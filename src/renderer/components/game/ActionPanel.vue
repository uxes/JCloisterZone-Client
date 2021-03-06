<template>
  <div
    class="action-panel"
    @click.right="onRightClick"
  >
    <div v-if="notifyConnectionClosed" class="flex-grow-1">
      <v-alert type="error">
        Host terminated the game. Connection was closed.
      </v-alert>
    </div>
    <div v-else-if="notifyConnectionReconnecting" class="flex-grow-1">
      <v-alert type="error">
        Connection interrupted. Reconnecting&hellip;
        <v-progress-linear
          indeterminate
          color="white"
        />
      </v-alert>
    </div>
    <PointsExpression
      v-else-if="pointsExpression"
      :expr="pointsExpression"
    />
    <!-- use v-show bit v-if for pointsExoression - to not hide related layers when pointExpression is triggered by mouse hover  -->
    <component
      :is="actionComponent"
      v-if="action"
      v-show="!pointsExpression && !notifyConnectionClosed && !notifyConnectionReconnecting"
      :action="action"
      :phase="phase"
      :local="local"
    >
      <template
        v-if="action.canPass"
        #default="{ plain, label }"
      >
        <template v-if="local">
          <span v-if="plain !== ''" class="skip-text text">or</span>
          <div class="pass-item">
            <v-btn large color="secondary" @click="pass">{{ label || 'Skip action' }}</v-btn>
          </div>
        </template>
        <template v-else>
          <span class="skip-text text">or skip the action</span>
        </template>
      </template>
    </component>
    <GameResultPanel
      v-else-if="phase === 'GameOverPhase'"
      v-show="!pointsExpression"
      class="game-over"
    />

    <audio
      ref="beep"
      src="~/assets/beep.wav"
    />
  </div>
</template>

<script>
import { mapState } from 'vuex'

import ActionPhaseAction from '@/components/game/actions/ActionPhaseAction.vue'
import BazaarPhaseAction from '@/components/game/actions/BazaarPhaseAction.vue'
import CastlePhaseAction from '@/components/game/actions/CastlePhaseAction.vue'
import CocCountPhaseAction from '@/components/game/actions/CocCountPhaseAction.vue'
import CornCircleChoice from '@/components/game/actions/CornCircleChoice.vue'
import CornCircleReturn from '@/components/game/actions/CornCircleReturn.vue'
import CommitActionPhaseAction from '@/components/game/actions/CommitActionPhaseAction.vue'
import DragonMovePhaseAction from '@/components/game/actions/DragonMovePhaseAction.vue'
import EscapePhaseAction from '@/components/game/actions/EscapePhaseAction.vue'
import FerryPhaseAction from '@/components/game/actions/FerryPhaseAction.vue'
import GameResultPanel from '@/components/game/GameResultPanel.vue'
import GoldPiecePhaseAction from '@/components/game/actions/GoldPiecePhaseAction.vue'
import PointsExpression from '@/components/game/PointsExpression.vue'
import RemoveMageOrWitchAction from '@/components/game/actions/RemoveMageOrWitchAction.vue'
import SelectPrisonerToExchangeAction from '@/components/game/actions/SelectPrisonerToExchangeAction.vue'
import ShepherdPhaseAction from '@/components/game/actions/ShepherdPhaseAction.vue'
import TilePhaseAction from '@/components/game/actions/TilePhaseAction.vue'
import TowerCapturePhaseAction from '@/components/game/actions/TowerCapturePhaseAction.vue'

const MAPPING = {
  AbbeyPhase: TilePhaseAction,
  ChangeFerriesPhase: FerryPhaseAction,
  CocFollowerPhase: ActionPhaseAction,
  CocScoringPhase: ActionPhaseAction,
  PlaceFerryPhase: FerryPhaseAction,
  PhantomPhase: ActionPhaseAction,
  WagonPhase: ActionPhaseAction
}

export default {
  components: {
    ActionPhaseAction,
    BazaarPhaseAction,
    CastlePhaseAction,
    CocCountPhaseAction,
    CornCircleChoice,
    CornCircleReturn,
    CommitActionPhaseAction,
    DragonMovePhaseAction,
    EscapePhaseAction,
    GameResultPanel,
    GoldPiecePhaseAction,
    FerryPhaseAction,
    PointsExpression,
    RemoveMageOrWitchAction,
    SelectPrisonerToExchangeAction,
    ShepherdPhaseAction,
    TilePhaseAction,
    TowerCapturePhaseAction
  },

  props: {
    phase: { type: String, required: true },
    action: { type: Object, default: null }
  },

  data () {
    return {
      selected: 0
    }
  },

  computed: {
    ...mapState({
      connectionState: state => state.networking.connectionStatus,
      pointsExpression: state => state.board.pointsExpression,
      beep: state => state.settings.beep
    }),

    notifyConnectionClosed () {
      return this.connectionState === null && this.phase !== 'GameOverPhase'
    },

    notifyConnectionReconnecting () {
      return this.connectionState === 'reconnecting'
    },

    local () {
      if (!this.action) {
        return false
      }
      const clientSessionId = this.$store.state.networking.sessionId
      const actionSessionId = this.$store.state.game.players[this.action.player].sessionId
      return clientSessionId === actionSessionId
    },

    actionComponent () {
      const component = MAPPING[this.phase]
      if (component) {
        return component
      }
      const itemType = this.action.items.length ? this.action.items[0].type : null
      if (this.phase === 'CornCirclePhase') {
        if (itemType === 'CornCircleSelectDeployOrRemove') {
          return CornCircleChoice
        } else {
          return itemType === 'ReturnMeeple' ? CornCircleReturn : ActionPhaseAction
        }
      }
      if (this.phase === 'TowerCapturePhase' && itemType === 'SelectPrisonerToExchange') {
        return SelectPrisonerToExchangeAction
      }
      if (this.phase === 'MageAndWitchPhase') {
        if (itemType === 'RemoveMageOrWitch') {
          return RemoveMageOrWitchAction
        } else {
          return ActionPhaseAction
        }
      }
      return this.phase + 'Action'
    }
  },

  watch: {
    local (val) {
      if (val) {
        this.onPlayerActivated()
      }
    }
  },

  mounted () {
    window.addEventListener('keydown', this.onKeyDown)
    if (this.local) {
      this.onPlayerActivated()
    }
  },

  beforeDestroy () {
    window.removeEventListener('keydown', this.onKeyDown)
  },

  methods: {
    onRightClick (ev) {
      this.$root.$emit('rclick', ev)
    },

    onKeyDown (ev) {
      if (ev.key === ' ' && this.action.canPass && !this.$store.state.gameDialog) {
        this.pass()
      }
    },

    async pass () {
      await this.$store.dispatch('game/apply', {
        type: 'PASS',
        payload: {}
      })
    },

    onPlayerActivated () {
      if (this.beep) {
        this.$refs.beep.play()
      }
    }
  }
}
</script>

<style lang="sass">
.action-panel
  position: absolute
  top: 0
  left: 0px
  width: calc(100% - #{$rside-width + $panel-gap})
  height: $action-bar-height
  display: flex
  align-items: stretch
  user-select: none

  +theme using ($theme)
    background: map-get($theme, 'opaque-bg')

  .text
    font-size: 20px
    font-weight: 300

  > section
    flex: 1
    display: flex
    justify-content: center
    align-items: center

    .skip-text
      margin-left: 40px

    .pass-item
      margin-left: 40px
      text-align: center

  .tile-img
    position: relative
    width: 84px
    height: 84px
    box-shadow: 2px 2px 5px 0px rgba(0,0,0,0.35)
    top: 7px
    transform: scale(1.1)

  .game-over
    text-align: center
    padding-top: 20px
</style>
