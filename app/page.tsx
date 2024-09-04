import InfiniteTimePicker from "@/components/TimeSelector";
import Calendar from "@/components/Calendar";
import ShareTime from "@/components/Time";
import ShareTimeVirt from "@/components/VirtualiserTime";

export default function Home() {
	return (
		<>
			<InfiniteTimePicker />
			<Calendar />
			<ShareTime />
			<ShareTimeVirt />
		</>
	);
}
