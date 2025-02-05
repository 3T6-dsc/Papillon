import * as React from "react";
import { memo, useCallback, useMemo } from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import CalendarKit from "@howljs/calendar-kit";
import { useCurrentAccount } from "@/stores/account";
import { useTimetableStore } from "@/stores/timetable";
import { useTheme } from "@react-navigation/native";
import { updateTimetableForWeekInCache } from "@/services/timetable";
import { dateToEpochWeekNumber } from "@/utils/epochWeekNumber";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import PapillonPicker from "@/components/Global/PapillonPicker";
import { AlertTriangle, CalendarDays } from "lucide-react-native";
import { PapillonHeaderAction } from "@/components/Global/PapillonModernHeader";
import { getSubjectData } from "@/services/shared/Subject";
import { PapillonNavigation } from "@/router/refs";
import PapillonSpinner from "@/components/Global/PapillonSpinner";
import { TimetableClassStatus } from "@/services/shared/Timetable";
import { NativeText } from "@/components/Global/NativeComponents";
import ButtonCta from "@/components/FirstInstallation/ButtonCta";

const LOCALES = {
  en: {
    weekDayShort: "Sun_Mon_Tue_Wed_Thu_Fri_Sat".split("_"),
    meridiem: { ante: "am", post: "pm" },
    more: "more",
  },
  fr: {
    weekDayShort: "Dim_Lun_Mar_Mer_Jeu_Ven_Sam".split("_"),
    meridiem: { ante: "am", post: "pm" },
    more: "plus",
  },
} as const;

const EventItem = memo(({ event }) => {
  const subjectData = useMemo(() => getSubjectData(event.event.title), [event.event]);
  const [layout, setLayout] = React.useState({ width: 0, height: 0 });

  return (
    <TouchableOpacity
      onLayout={(e) => setLayout(e.nativeEvent.layout)}
      style={[
        {
          flex: 1,
          borderRadius: 5,
          overflow: "hidden",
          borderCurve: "continuous",
        },
        event.event.status == TimetableClassStatus.CANCELED && {
          borderColor: "red",
          borderWidth: 2,
        }
      ]}
      activeOpacity={0.7}
      onPress={() => {
        PapillonNavigation.current.navigate("LessonDocument", { lesson: event.event });
      }}
    >
      {event.event.statusText && (
        <View
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            backgroundColor: "#00000099",
            zIndex: 1000,
            borderRadius: 30,
            borderColor: "#ffffff99",
            borderWidth: 2,
            padding: 4,
            paddingBottom: 2,
            paddingLeft: 2,
          }}
        >
          <AlertTriangle
            size={18}
            color={"#ffffff"}
            strokeWidth={2}
            style={{ margin: 4 }}
          />
        </View>
      )}

      <View
        style={[
          {
            flex: 1,
            backgroundColor: subjectData.color,
            borderRadius: 0,
            padding: 4,
            flexDirection: "column",
            gap: 2
          },
          event.event.status == TimetableClassStatus.CANCELED && {
            opacity: 0.3,
            backgroundColor: "grey",
          },
        ]}
      >
        <Text
          numberOfLines={3}
          style={[
            {
              color: "white",
              fontSize: 13,
              letterSpacing: 0.2,
              fontFamily: "semibold",
              textTransform: "uppercase",
            },
            layout.width > 100 && {
              fontSize: 15,
              letterSpacing: 0.1,
              textTransform: "none",
            },
          ]}
        >
          {subjectData.pretty}
        </Text>
        <Text
          numberOfLines={2}
          style={{
            color: "white",
            fontSize: 13,
            letterSpacing: 0.2,
            fontFamily: "medium",
            opacity: 0.6,
          }}
        >
          {event.event.room}
        </Text>
      </View>
    </TouchableOpacity>
  );
});

const HeaderItem = memo(({ header }) => {
  const theme = useTheme();

  const cols = header.extra.columns;
  const start = header.startUnix;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const todayStamp = today.getTime();

  return (
    <View
      style={{
        flex: 1,
        flexDirection: "row",
        height: 50,
        borderBottomWidth: 1,
        borderColor: theme.colors.border,
        backgroundColor: theme.colors.background,
      }}
    >
      {Array.from({ length: cols }, (_, i) => (
        <View
          key={i}
          style={[
            {
              flex: 1,
              height: 50,
              justifyContent: "center",
              gap: 1,
              paddingTop: 1,
            }
          ]}
        >
          <Text
            style={{
              textAlign: "center",
              fontSize: 14,
              fontFamily: "medium",
              opacity: 0.6,
              letterSpacing: 0.5,
              color: theme.colors.text,
            }}
          >
            {new Date(start
              + i * 24 * 60 * 60 * 1000
            ).toLocaleDateString("fr-FR", {weekday: "short"})}
          </Text>
          <Text
            style={[
              {
                textAlign: "center",
                fontSize: 17,
                fontFamily: "semibold",
                paddingVertical: 3,
                paddingHorizontal: 10,
                alignSelf: "center",
                borderRadius: 12,
                minWidth: 42,
                borderCurve: "continuous",
                overflow: "hidden",
                color: theme.colors.text,
              },
              start
              + i * 24 * 60 * 60 * 1000 === todayStamp && {
                backgroundColor: theme.colors.primary,
                color: "white",
              }
            ]}
          >
            {new Date(start
              + i * 24 * 60 * 60 * 1000
            ).toLocaleDateString("fr-FR", {day: "numeric"})}
          </Text>
        </View>
      ))}
    </View>
  );
});

const displayModes = ["Semaine", "3 jours", "Journée"];

const Week = ({ route, navigation }) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const outsideNav = route.params?.outsideNav;

  const [loadedWeeks, setLoadedWeeks] = React.useState(() => new Set());
  const [isLoading, setIsLoading] = React.useState(false);

  const account = useCurrentAccount((store) => store.account);
  const timetables = useTimetableStore((store) => store.timetables);

  const [displayMode, setDisplayMode] = React.useState("Semaine");

  const customTheme = useMemo(() => ({
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      border: theme.colors.border + "88",
      text: theme.colors.text,
      surface: theme.colors.card,
      onPrimary: theme.colors.background,
      onBackground: theme.colors.text,
      onSurface: theme.colors.text,
    }
  }), [theme.colors]);

  const events = useMemo(() =>
    Object.values(timetables)
      .flat()
      .map(event => ({
        id: event.id,
        title: event.title,
        start: { dateTime: new Date(event.startTimestamp) },
        end: { dateTime: new Date(event.endTimestamp) },
        event: event,
      })),
  [timetables]
  );

  const loadTimetableWeek = useCallback(async (weekNumber, force = false) => {
    if (!force && loadedWeeks.has(weekNumber)) return;

    setIsLoading(true);
    try {
      await updateTimetableForWeekInCache(account, weekNumber, force);
      setLoadedWeeks(prev => new Set([...prev, weekNumber]));
    } finally {
      setIsLoading(false);
    }
  }, [account, loadedWeeks]);

  const handleDateChange = useCallback(async (date) => {
    const weekNumber = dateToEpochWeekNumber(new Date(date));
    await loadTimetableWeek(weekNumber);
  }, [loadTimetableWeek]);

  return (
    <View style={{ flex: 1 }}>
      {!outsideNav && (
        <View
          style={{
            height: insets.top,
          }}
        />
      )}

      {account.providers?.includes("ical") && (
        <View
          style={{
            zIndex: 100000,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            width: "100%",
            height: "100%",
            backgroundColor: theme.colors.background,
            justifyContent: "center",
            alignItems: "center",
            gap: 6,
            padding: 24,
          }}
        >
          <CalendarDays
            size={36}
            strokeWidth={2}
            color={theme.colors.text}
            style={{ marginBottom: 6 }}
          />
          <NativeText
            variant="title"
            style={{textAlign: "center"}}
          >
            Aucun agenda externe
          </NativeText>
          <NativeText
            variant="subtitle"
            style={{textAlign: "center"}}
          >
            Importez un calendrier depuis une URL de votre agenda externe tel que ADE ou Moodle.
          </NativeText>

          <View style={{ height: 24 }} />

          <ButtonCta
            value="Importer mes cours"
            primary
            onPress={() => {
              PapillonNavigation.current.navigate("LessonsImportIcal");
            }}
          />
          <ButtonCta
            value="Comment faire ?"
            onPress={() => {
              Linking.openURL("https://support.papillon.bzh/articles/351142-import-ical");
            }}
          />
        </View>
      )}

      <View
        style={{
          zIndex: 1000,
          overflow: "visible",
          position: "absolute",
          left: 12,
          top: !outsideNav ? (insets.top + 3) : 6,
        }}
      >
        <PapillonPicker
          animated
          direction="left"
          delay={0}
          selected={displayMode}
          onSelectionChange={(mode) => setDisplayMode(mode)}
          data={displayModes}
        >
          <PapillonHeaderAction
            icon={
              isLoading ? (
                <PapillonSpinner
                  size={20}
                  strokeWidth={5}
                  color={theme.colors.text}
                />
              ) : (
                <CalendarDays />
              )
            }
          />
        </PapillonPicker>
      </View>

      <CalendarKit
        theme={customTheme}
        numberOfDays={displayMode === "Semaine" ? 5 : displayMode === "3 jours" ? 3 : 1}
        hideWeekDays={displayMode === "Semaine" ? [6, 7] : []}
        pagesPerSide={2}
        scrollByDay={displayMode === "Semaine" ? false : true}
        events={events}
        onDateChanged={handleDateChange}
        initialLocales={LOCALES}
        locale="fr"
        hourFormat="HH:mm"
        renderEvent={(event) => <EventItem event={event} />}
        renderHeaderItem={(header) => <HeaderItem header={header} />}
        dayBarHeight={50}
      />
    </View>
  );
};

export default memo(Week);